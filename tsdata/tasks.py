import csv
import datetime
import io

from celery.utils.log import get_task_logger
from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.db.models import Max, OuterRef, Q, Subquery
from django.utils import timezone

from nc.data.importer import run as nc_run
from traffic_stops.celery import app
from traffic_stops.healthchecks import HealthcheckSignal, ping_healthcheck
from tsdata.models import Dataset, Import

logger = get_task_logger(__name__)

RUN_MAP = {
    settings.NC_KEY: nc_run,
}


@app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=5,
)
def ping_healthcheck_task(
    self, slug: str, signal: str = "SUCCESS", auto_provision: bool = True
) -> bool:
    """Celery task to ping healthchecks.io with retry support.

    Uses exponential backoff for transient network errors.

    Args:
        self: Celery task instance (bound)
        slug: The check's slug identifier
        signal: Signal name (SUCCESS, START, FAILURE, LOG)
        auto_provision: If True, creates the check if it doesn't exist

    Returns:
        True if ping was successful, False otherwise
    """
    # Validate signal is a valid enum value
    try:
        signal_enum = HealthcheckSignal[signal]
    except KeyError:
        logger.error(
            "ping_healthcheck_task.invalid_signal signal=%s valid_signals=%s",
            signal,
            list(HealthcheckSignal.__members__.keys()),
        )
        return False

    return ping_healthcheck(slug=slug, signal=signal_enum, auto_provision=auto_provision)


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

    ping_healthcheck_task.delay(slug="import-dataset")


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
        ping_healthcheck_task.delay(slug="compliance-report")
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

    ping_healthcheck_task.delay(slug="compliance-report")
