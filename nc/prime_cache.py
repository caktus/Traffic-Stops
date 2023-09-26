import logging

from time import perf_counter

from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, F, Sum
from django.test.client import Client
from django.urls import reverse

from nc.models import Stop, StopSummary

logger = logging.getLogger(__name__)
API_ENDPOINT_NAMES = (
    "nc:agency-api-stops",
    "nc:agency-api-stops-by-reason",
    "nc:agency-api-searches",
    "nc:agency-api-searches-by-type",
    "nc:agency-api-contraband-hit-rate",
    "nc:agency-api-use-of-force",
    "nc:stops-by-count",
    "nc:stop-purpose-groups",
    "nc:stops-grouped-by-purpose",
)
DEFAULT_CUTOFF_SECS = 4


def avoid_newrelic_bug():
    """
    New Relic middleware throws an exception when a web request is run in a
    Celery task (without going through HTTP).

    An AttributeError is thrown here:

    https://github.com/edmorley/newrelic-python-agent/blob/v2.82.0.62/newrelic/
    newrelic/hooks/framework_django.py#L93

    AttributeError: 'BackgroundTask' object has no attribute 'rum_header_generated'

    By disabling the browser_monitoring setting checked for just before the
    AttributeError, this New Relic gets out of the way before the problem.

    In production, this normally runs in a Celery task that exits when the
    import is finished due to the Celery "--maxtasksperchild 1" parameter.
    Even if more tasks ran in the same process, they too won't be handling
    browser requests so the setting change won't affect such tasks.

    This Mozilla project ticket has a copy of some correspondence with New Relic:
        https://bugzilla.mozilla.org/show_bug.cgi?id=1196043
    (I am unable to access the referenced New Relic ticket.)
    """
    try:
        from newrelic.hooks.framework_django import django_settings

        django_settings.browser_monitoring.auto_instrument = False
    except ImportError:
        pass


class Timer:
    def __init__(self, cutoff):
        self.cutoff = cutoff

    def __enter__(self):
        self.start = perf_counter()
        return self

    def __exit__(self, type, value, traceback):
        self.elapsed = perf_counter() - self.start
        self.stop = self.elapsed < self.cutoff
        self.readout = f"{self.elapsed} < {self.cutoff} = {self.stop}"


class CachePrimer:
    def __init__(self, cutoff_secs=0, cutoff_count=None):
        self.cutoff_secs = cutoff_secs
        self.cutoff_count = cutoff_count
        self.count = 0

    def request(self, uri, payload=None):
        c = Client()
        if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS[0] != "*":
            host = settings.ALLOWED_HOSTS[0]
        else:
            host = "127.0.0.1"
        logger.debug(f"Querying {uri}")
        response = c.get(uri, data=payload, HTTP_HOST=host)
        if response.status_code != 200:
            logger.warning("Status not OK: {} ({})".format(uri, response.status_code))
            raise Exception("Request to %s failed: %s", uri, response.status_code)

    def get_endpoints(self):
        for idx, row in enumerate(self.get_queryset()):
            with Timer(self.cutoff_secs) as timer:
                yield self.get_urls(row)
            officer_id = row.get("officer_id", "")
            logger.info(
                (
                    "Primed cache for agency %s:%s "
                    "[officer_id=%s] with "
                    "%s stops in %.2f secs (%s of %s)"
                ),
                row["agency_id"],
                row["agency_name"],
                officer_id,
                "{:,}".format(row["num_stops"]),
                timer.elapsed,
                idx,
                self.count,
            )
            if timer.stop or (self.cutoff_count and idx == self.cutoff_count):
                logger.info("Cutoff reached, stopping...")
                break

    def prime(self):
        logger.info(f"{self} starting")
        self.count = self.get_queryset().count()
        logger.info(f"{self} priming {self.count:,} objects")
        for endpoints in self.get_endpoints():
            for endpoint in endpoints:
                self.request(endpoint)

    def __repr__(self):
        options = []
        if self.cutoff_secs:
            options.append(f"cutoff_secs={self.cutoff_secs}")
        if self.cutoff_count:
            options.append(f"cutoff_count={self.cutoff_count}")
        return f"<{self.__class__.__name__} {' '.join(options)}>"


class AgencyStopsPrimer(CachePrimer):
    def get_queryset(self):
        return (
            Stop.objects.no_cache()
            .annotate(agency_name=F("agency_description"))
            .values("agency_name", "agency_id")
            .annotate(num_stops=Count("stop_id"))
            .order_by("-num_stops")
        )

    def get_urls(self, row):
        urls = []
        for endpoint_name in API_ENDPOINT_NAMES:
            urls.append(reverse(endpoint_name, args=[row["agency_id"]]))
        return urls


class OfficerStopsPrimer(CachePrimer):
    def get_queryset(self):
        return (
            StopSummary.objects.all()
            .annotate(agency_name=F("agency__name"))
            .values("agency_name", "agency_id", "officer_id")
            .annotate(num_stops=Sum("count"))
            .order_by("-num_stops")
        )

    def get_urls(self, row):
        urls = []
        for endpoint_name in API_ENDPOINT_NAMES:
            agency_url = reverse(endpoint_name, args=[row["agency_id"]])
            urls.append(f"{agency_url}?officer={row['officer_id']}")
        return urls


def run(
    cutoff_duration_secs=None,
    clear_cache=False,
    skip_agencies=False,
    skip_officers=False,
    officer_cutoff_count=None,
):
    """
    Prime query cache for "big" NC agencies.

    Order the agencies by number of stops, and keep making the web requests
    that use the queries until the queries for an agency take less than
    cutoff_duration_secs.

    This is expected to be used as part of the following flow:
    1. reload new NC data
    2. flush memcached
    3. prime the cache to load the new data into the query cache

    If memcached isn't flushed before priming the cache, this function will
    presumably exit prematurely without loading the new data.

    This uses the Django test client to avoid encountering Gunicorn timeouts,
    so it can't be used remotely.

    :param cutoff_duration_secs: Once priming the cache for an agency takes
    less than this, stop.
    """
    if cutoff_duration_secs is None:
        cutoff_duration_secs = DEFAULT_CUTOFF_SECS

    avoid_newrelic_bug()

    if clear_cache:
        logger.info("Clearing cache")
        cache.clear()

    if not skip_agencies:
        AgencyStopsPrimer(cutoff_secs=cutoff_duration_secs).prime()

    if not skip_officers:
        OfficerStopsPrimer(
            cutoff_secs=0, cutoff_count=officer_cutoff_count
        ).prime()  # cache all officer endpoins for now

    logger.info("Complete")
