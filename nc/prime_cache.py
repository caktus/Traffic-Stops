import logging
import time

from contextlib import contextmanager
from typing import Generator

import boto3
import httpx

from django.conf import settings
from django.db.models import F, Q, Sum
from django.urls import reverse

from nc.models import StopSummary

logger = logging.getLogger(__name__)
API_ENDPOINT_NAMES = (
    "nc:year-range",
    "nc:agency-api-stops",
    "nc:agency-api-stops-by-reason",
    "nc:agency-api-searches",
    "nc:agency-api-searches-by-type",
    "nc:agency-api-use-of-force",
    "nc:stops-by-percentage",
    "nc:stops-by-count",
    "nc:stop-purpose-groups",
    "nc:stops-grouped-by-purpose",
    "nc:searches-by-percentage",
    "nc:searches-by-count",
    "nc:search-rate",
    "nc:contraband-percentages",
    "nc:contraband-type-percentages",
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
CLOUDFRONT_RESPONSE_TIMEOUT = 60


class Timer:
    """Context manager to time a block of code"""

    def __init__(self, threshold_seconds: int = None):
        self.threshold_seconds = threshold_seconds

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, type, value, traceback):
        self.elapsed = time.perf_counter() - self.start
        self.exceeded_threshold = (
            self.elapsed > self.threshold_seconds if self.threshold_seconds else False
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


@contextmanager
def client() -> Generator[httpx.Client, None, None]:
    """Return a configured HTTPX client for cache priming"""
    # Attempt to match Browser behavior
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
    }
    # Configure basic auth (for staging environment)
    auth = None
    if settings.CACHE_BASICAUTH_USERNAME and settings.CACHE_BASICAUTH_PASSWORD:
        auth = httpx.BasicAuth(
            username=settings.CACHE_BASICAUTH_USERNAME, password=settings.CACHE_BASICAUTH_PASSWORD
        )
    with httpx.Client(
        auth=auth, headers=headers, http2=True, timeout=CLOUDFRONT_RESPONSE_TIMEOUT
    ) as client:
        yield client


def prime_endpoint_cache(client: httpx.Client, url: str, headers: dict = None):
    """Prime the cache for a single endpoint"""
    logger.debug(f"Priming endpoint cache ({url=})...")
    with Timer(threshold_seconds=CLOUDFRONT_RESPONSE_TIMEOUT - 1) as timer:
        response = client.get(url, headers=headers)
    logger.debug(
        f"Queried {url=} ({response.headers=}, {response.request.headers=}, {timer.elapsed=})"
    )
    if timer.exceeded_threshold:
        raise Exception(f"Slow prime cache response possibly not cached {url} ({timer.elapsed})")
    if response.status_code != 200:
        raise Exception(f"Request to {url} failed: {response.status_code}")


def prime_group_cache(agency_id: int, num_stops: int, officer_id: int = None):
    """Prime the cache for an agency (and optionally officer)"""
    logger.debug(f"Priming group cache ({agency_id=}, {officer_id=}, {num_stops=})...")
    with client() as c:
        logger.info(
            f"Priming cache ({agency_id=}, {officer_id=}, {num_stops=}, {bool(c.auth)=})..."
        )
        urls = get_group_urls(agency_id=agency_id, officer_id=officer_id)
        with Timer() as group_timer:
            for url in urls:
                # Request with brotli encoding
                prime_endpoint_cache(
                    client=c,
                    url=url,
                    # headers={"Accept-Encoding": "gzip, deflate, br, zstd"},
                )
                # Add a URL with a trailing ? to ensure the cache is primed
                # since React sometimes appends it to the URL
                prime_endpoint_cache(client=c, url=url + "?")
                # Request with alternative gzip encoding
                prime_endpoint_cache(
                    client=c,
                    url=url,
                    headers={"Accept-Encoding": "gzip, deflate, zstd"},
                )

        logger.info(
            f"Primed cache ({agency_id=}, {officer_id=}, {num_stops=}, {group_timer.elapsed=})"
        )


def invalidate_cloudfront_cache(sleep_seconds: int = 30) -> dict:
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
        resp_invalidation: dict = cf.create_invalidation(
            DistributionId=settings.CACHE_CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch={
                "Paths": {"Quantity": 1, "Items": ["/*"]},
                "CallerReference": str(time.time()).replace(".", ""),
            },
        )
        invalidation_id: str = resp_invalidation["Invalidation"]["Id"]
        # Wait for invalidation to complete
        invalidation_in_progress = True
        while invalidation_in_progress:
            response = cf.get_invalidation(
                DistributionId=settings.CACHE_CLOUDFRONT_DISTRIBUTION_ID, Id=invalidation_id
            )
            status = response["Invalidation"]["Status"]
            if status == "Completed":
                # Stop waiting, invalidation is complete
                invalidation_in_progress = False
                logger.info(f"Invalidation complete ({status=})")
            elif status == "InProgress":
                # Wait before checking again
                logger.debug(
                    f"Invalidation pending ({status=}), sleeping for {sleep_seconds} seconds..."
                )
                time.sleep(sleep_seconds)
            else:
                raise Exception(f"Invalidation failed: {status})")
