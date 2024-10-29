import os
import shutil

from datetime import timedelta

from django.conf import settings
from django.utils.timezone import now

from celery.utils.log import get_task_logger
from nc import prime_cache
from nc.data.importer import MAGIC_NC_FTP_URL
from traffic_stops.celery import app
from tsdata.models import Dataset
from tsdata.tasks import import_dataset

logger = get_task_logger(__name__)
MAGIC_NC_DATASET_NAME = "Automated NC import"


@app.task
def download_and_import_nc_dataset():
    """
    This task is responsible for automatically downloading
    and importing the latest NC data.  It does this by
    setting up a Dataset model instance appropriately then
    triggering a download task (as if an admin had triggered
    it manually).
    """
    logger.info("Triggering automatic NC import")
    Dataset.objects.filter(name=MAGIC_NC_DATASET_NAME).delete()
    if os.path.exists(settings.NC_AUTO_IMPORT_DIRECTORY):
        logger.info("Cleaning up download directory %s", settings.NC_AUTO_IMPORT_DIRECTORY)
        shutil.rmtree(settings.NC_AUTO_IMPORT_DIRECTORY)
    nc_dataset = Dataset(
        state=settings.NC_KEY,
        name=MAGIC_NC_DATASET_NAME,
        # NC data export updated nightly around 10:30 p.m. Eastern
        date_received=now().date() - timedelta(days=1),
        url=MAGIC_NC_FTP_URL,
        destination=settings.NC_AUTO_IMPORT_DIRECTORY,
    )
    if len(settings.NC_AUTO_IMPORT_MONITORS) >= 1:
        nc_dataset.report_email_1 = settings.NC_AUTO_IMPORT_MONITORS[0]
    if len(settings.NC_AUTO_IMPORT_MONITORS) >= 2:
        nc_dataset.report_email_2 = settings.NC_AUTO_IMPORT_MONITORS[1]
    nc_dataset.save()
    import_dataset.delay(nc_dataset.pk)


@app.task(autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def prime_group_cache(agency_id: int, num_stops: int, officer_id: int = None):
    """Prime the cache for a single agency (and optionally officer)"""
    prime_cache.prime_group_cache(agency_id=agency_id, num_stops=num_stops, officer_id=officer_id)
    # Run the task again to ensure the cache is primed
    prime_cache.prime_group_cache(agency_id=agency_id, num_stops=num_stops, officer_id=officer_id)
    return (agency_id, officer_id, num_stops)


def prime_groups_cache(
    by_officer: bool = False, cutoff_count: int = 0, limit_to_agencies: list = None
):
    kind = "officer" if by_officer else "agency"
    logger.info(f"Querying {kind} endpoint groups ({by_officer=}, {cutoff_count=})")
    # Get the agencies (and officers) sorted by number of stops
    endpoint_groups = prime_cache.get_agencies_and_officers(
        by_officer=by_officer, limit_to_agencies=limit_to_agencies
    )
    logger.info(f"Queuing {len(endpoint_groups):,} {kind} endpoint groups")
    for endpoint_group in endpoint_groups:
        if endpoint_group.num_stops <= cutoff_count:
            logger.info(f"Stopping due to cutoff ({endpoint_group.num_stops=}, {cutoff_count=})")
            break
        prime_group_cache.delay(**endpoint_group._asdict())


@app.task
def prime_all_endpoints(
    clear_cache=False,
    skip_agencies=False,
    skip_officers=True,
    agency_cutoff_count=None,
    limit_to_agencies=None,
):
    """Prime all API endpoint caches"""
    if clear_cache:
        prime_cache.invalidate_cloudfront_cache()

    if not skip_agencies:
        prime_groups_cache(
            by_officer=False, cutoff_count=agency_cutoff_count, limit_to_agencies=limit_to_agencies
        )

    if not skip_officers:
        prime_groups_cache(by_officer=True, limit_to_agencies=limit_to_agencies)

    logger.info("Complete")
