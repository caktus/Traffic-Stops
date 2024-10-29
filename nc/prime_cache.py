import logging
import time

import boto3
import requests

from django.conf import settings
from django.db.models import F, Q, Sum
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


def get_agencies_and_officers(by_officer: bool = False, limit_to_agencies: list = None) -> list:
    """Return a list of agencies (and optionally officers) sorted by number of stops"""
    limit_to_agencies = limit_to_agencies or []
    values = ["agency_id"]
    if by_officer:
        values.append("officer_id")
    query = Q()
    if limit_to_agencies:
        query &= Q(agency_id__in=limit_to_agencies)
    rows = list(
        StopSummary.objects.filter(query)
        .annotate(agency_name=F("agency__name"))
        .values(*values)
        .annotate(num_stops=Sum("count"))
        .order_by("-num_stops")
        .values_list(*values + ["num_stops"], named=True)
    )
    if not by_officer and not limit_to_agencies:
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
    logger.info(
        f"Found {len(rows):,} agencies and officers "
        f"({by_officer=}, {limit_to_agencies=}, {values=}, {query=})"
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
    session = requests.Session()
    # Configure basic auth if provided
    if settings.CACHE_BASICAUTH_USERNAME and settings.CACHE_BASICAUTH_PASSWORD:
        session.auth = (settings.CACHE_BASICAUTH_USERNAME, settings.CACHE_BASICAUTH_PASSWORD)
    logger.info(
        f"Priming cache ({agency_id=}, {officer_id=}, {num_stops=}, {bool(session.auth)=})..."
    )
    urls = get_group_urls(agency_id=agency_id, officer_id=officer_id)
    for url in urls:
        logger.debug(f"Querying {url}")
        response = session.get(url)
        if response.status_code != 200:
            logger.warning(f"Status not OK: {url} ({response.status_code})")
            raise Exception(f"Request to {url} failed: {response.status_code}")
    logger.info(f"Primed cache ({agency_id=}, {officer_id=}, {num_stops=})")


def invalidate_cloudfront_cache() -> dict:
    """
    Invalidate the CloudFront cache before priming the cache.

    https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cloudfront/client/create_invalidation.html
    """
    if settings.CACHE_CLOUDFRONT_DISTRIBUTION_ID:
        logger.info(
            f"Invalidating CloudFront distribution ({settings.CACHE_CLOUDFRONT_DISTRIBUTION_ID=})"
        )
        cf = boto3.client("cloudfront")
        # Create CloudFront invalidation
        return cf.create_invalidation(
            DistributionId=settings.CACHE_CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch={
                "Paths": {"Quantity": 1, "Items": ["/*"]},
                "CallerReference": str(time.time()).replace(".", ""),
            },
        )
