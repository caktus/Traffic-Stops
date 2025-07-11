import csv
import datetime
import io

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.db.models import Max, OuterRef, Q, Subquery
from django.utils import timezone

from celery.utils.log import get_task_logger
from nc.data.importer import run as nc_run
from traffic_stops.celery import app
from tsdata.models import Dataset, Import

logger = get_task_logger(__name__)

RUN_MAP = {
    settings.NC_KEY: nc_run,
}


@app.task
def import_dataset(dataset_id):
    """Execute a state dataset import process"""
    logger.info(f"Received Dataset ID: {dataset_id}")
    dataset = Dataset.objects.get(pk=dataset_id)
    run = Import.objects.create(dataset=dataset)
    logger.info(f"Starting {dataset.state} import")
    state_import = RUN_MAP[run.dataset.state]
    report_emails = [email for email in [dataset.report_email_1, dataset.report_email_2] if email]
    try:
        state_import(dataset.url, destination=dataset.destination)
    except Exception:
        run.date_finished = timezone.now()
        run.save()
        raise
    run.successful = True
    run.date_finished = timezone.now()
    run.save()
    logger.info("Import complete")
    if report_emails:
        send_mail(
            "Import completed successfully",
            f"Import of {dataset} completed successfully",
            settings.DEFAULT_FROM_EMAIL,
            report_emails,
        )

    compliance_report.delay(dataset_id)


@app.task
def compliance_report(dataset_id):
    logger.info("Generating compliance report")
    if not settings.COMPLIANCE_REPORT_LIST:
        return

    dataset = Dataset.objects.get(pk=dataset_id)
    if dataset.state != settings.NC_KEY:
        return

    Agency = dataset.agency_model

    now = timezone.now()

    logger.info("Updating agency last stop")
    Agency.objects.update(
        last_reported_stop=Subquery(
            Agency.objects.filter(id=OuterRef("id"))
            .annotate(last_reported=Max("stops__date"))
            .values("last_reported")[:1]
        )
    )

    qs = (
        Agency.objects.filter(
            Q(last_reported_stop__lt=now - datetime.timedelta(days=90))
            | Q(last_reported_stop__isnull=True)
        )
        .values("id", "name", "last_reported_stop")
        .order_by("-last_reported_stop")
    )

    if not qs:
        send_mail(
            f"{dataset.state.upper()} Compliance Report, {now.date().isoformat()}",
            "All agencies have reported within the last 90 days.",
            settings.DEFAULT_FROM_EMAIL,
            settings.COMPLIANCE_REPORT_LIST,
        )
        return

    csvfile = io.StringIO()
    writer = csv.DictWriter(csvfile, fieldnames=("id", "name", "last_reported_stop"))
    writer.writeheader()
    writer.writerows(filter(lambda r: r["last_reported_stop"] is not None, qs))
    # Sort the agencies with no stops reported last
    writer.writerows(filter(lambda r: r["last_reported_stop"] is None, qs))

    message = EmailMessage(
        f"{dataset.state.upper()} Compliance Report, {now.date().isoformat()}",
        "Attached are the agencies out of compliance in the most recent data import.",
        settings.DEFAULT_FROM_EMAIL,
        settings.COMPLIANCE_REPORT_LIST,
    )
    message.attach("report.csv", csvfile.getvalue(), "text/csv")
    message.send()
