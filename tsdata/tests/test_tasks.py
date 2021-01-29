import csv
import datetime
import io

from django.core import mail
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from nc.tests.factories import AgencyFactory as NCAgencyFactory
from nc.tests.factories import StopFactory as NCStopFactory
from tsdata import tasks
from tsdata.tests.factories import DatasetFactory


@override_settings(COMPLIANCE_REPORT_LIST=("compliance@example.com",))
class ComplianceReportTests(TransactionTestCase):
    databases = "__all__"

    def test_all_agencies_good(self):
        for i in range(3):
            agency = NCAgencyFactory()
            NCStopFactory(agency=agency, date=timezone.now() - datetime.timedelta(days=30))

        dataset = DatasetFactory(state="nc")

        tasks.compliance_report(dataset.id)
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox.pop()
        self.assertEqual(msg.body, "All agencies have reported within the last 90 days.")
        self.assertEqual(len(msg.attachments), 0)

    def test_agency_last_stop_changed(self):
        agency = NCAgencyFactory()
        date_last_stop = timezone.now() - datetime.timedelta(days=30)
        NCStopFactory(agency=agency, date=date_last_stop)
        dataset = DatasetFactory(state="nc")
        tasks.compliance_report(dataset.id)
        agency.refresh_from_db()
        self.assertEqual(date_last_stop.strftime("%Y-%m-%d"), str(agency.last_reported_stop))

    def test_report_sent(self):
        agencies = [NCAgencyFactory() for i in range(5)]
        days = [10, 30, 100, 130]
        stops = [
            NCStopFactory(agency=agency, date=timezone.now() - datetime.timedelta(days=d))
            for d, agency in zip(days, agencies)
        ]

        dataset = DatasetFactory(state="nc")

        tasks.compliance_report(dataset.id)
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox.pop()
        self.assertEqual(
            msg.body, "Attached are the agencies out of compliance in the most recent data import."
        )
        self.assertEqual(len(msg.attachments), 1)
        filename, contents, mimetype = msg.attachments[0]
        csvfile = io.StringIO(contents)
        reader = csv.DictReader(csvfile)
        rows = list(reader)

        self.assertEqual(len(rows), 3)
        self.assertEqual(
            rows[0],
            {
                "id": str(agencies[2].id),
                "name": agencies[2].name,
                "last_reported_stop": stops[2].date.strftime("%Y-%m-%d"),
            },
        )
        self.assertEqual(
            rows[1],
            {
                "id": str(agencies[3].id),
                "name": agencies[3].name,
                "last_reported_stop": stops[3].date.strftime("%Y-%m-%d"),
            },
        )
        self.assertEqual(
            rows[2], {"id": str(agencies[4].id), "name": agencies[4].name, "last_reported_stop": ""}
        )
