import logging

import requests

from django.conf import settings
from django.db.models import F, Sum
from django.urls import reverse

from nc.models import StopSummary

logger = logging.getLogger(__name__)
API_ENDPOINT_NAMES = (
    "nc:agency-api-stops",
    "nc:agency-api-stops-by-reason",
    "nc:agency-api-searches",
    "nc:agency-api-searches-by-type",
    "nc:agency-api-use-of-force",
    "nc:stops-by-percentage",
    "nc:stops-by-count",
    "nc:stop-purpose-groups",
    "nc:stops-grouped-by-purpose",
    "nc:contraband-percentages",
    "nc:searches-by-percentage",
    "nc:searches-by-count",
    "nc:search-rate",
    "nc:contraband-percentages-stop-purpose-groups",
    "nc:contraband-percentages-grouped-stop-purpose",
    "nc:contraband-percentages-grouped-stop-purpose-modal",
    "nc:use-of-force",
    "nc:arrests-percentage-of-stops",
    "nc:arrests-percentage-of-searches",
    "nc:arrests-stops-driver-arrested",
    "nc:arrests-percentage-of-stops-by-purpose-group",
    "nc:arrests-percentage-of-stops-per-stop-purpose",
    "nc:arrests-percentage-of-searches-by-purpose-group",
    "nc:arrests-percentage-of-searches-per-stop-purpose",
    "nc:arrests-percentage-of-stops-per-contraband-type",
)


def get_agencies_and_officers(by_officer: bool = False):
    """Return a list of agencies (and optionally officers) sorted by number of stops"""
    values = ["agency_id"]
    if by_officer:
        values.append("officer_id")
    rows = list(
        StopSummary.objects.all()
        .annotate(agency_name=F("agency__name"))
        .values(*values)
        .annotate(num_stops=Sum("count"))
        .order_by("-num_stops")
        .values_list(*values + ["num_stops"], named=True)
    )
    if not by_officer:
        # Manually insert the statewide to force the caching since a
        # stop instance won't directly be associated with the statewide agency id.
        Row = rows[0].__class__
        rows.insert(
            0,
            Row(
                agency_id=-1,
                num_stops=StopSummary.objects.aggregate(Sum("count"))["count__sum"],
            ),
        )
    return rows


def get_group_urls(agency_id: int, officer_id: int = None) -> list[str]:
    """Return a list of endpoint URLs for an agency (and optionally an officer)"""
    if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS[0] != "*":
        host = f"https://{settings.ALLOWED_HOSTS[0]}"
    else:
        host = "http://127.0.0.1:8000"
    urls = []
    for endpoint_name in API_ENDPOINT_NAMES:
        url = reverse(endpoint_name, args=[agency_id])
        if officer_id:
            url += f"?officer={officer_id}"
        urls.append(host + url)
    return urls


def prime_group_cache(agency_id: int, num_stops: int, officer_id: int = None):
    """Prime the cache for an agency (and optionally officer)"""
    logger.info(f"Priming cache ({agency_id=}, {officer_id=}, {num_stops=})...")
    urls = get_group_urls(agency_id=agency_id, officer_id=officer_id)
    for url in urls:
        logger.debug(f"Querying {url}")
        response = requests.get(url)
        if response.status_code != 200:
            logger.warning(f"Status not OK: {url} ({response.status_code})")
            raise Exception(f"Request to {url} failed: {response.status_code}")
    logger.info(f"Primed cache ({agency_id=}, {officer_id=}, {num_stops=})")
