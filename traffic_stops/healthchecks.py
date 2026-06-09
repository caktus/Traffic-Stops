"""Healthchecks.io integration for monitoring background tasks.

This module provides utilities for pinging healthchecks.io to monitor
the status of background tasks. It uses slug-based URLs which allow
human-readable check identifiers.

See: https://healthchecks.io/docs/http_api/
"""

import logging

from enum import Enum

import requests

from django.conf import settings

logger = logging.getLogger(__name__)


class HealthcheckSignal(Enum):
    """Signal types for healthchecks.io pinging API."""

    SUCCESS = ""
    START = "/start"
    FAILURE = "/fail"
    LOG = "/log"


def ping_healthcheck(
    slug: str, signal: HealthcheckSignal = HealthcheckSignal.SUCCESS, auto_provision: bool = True
) -> bool:
    """Ping a healthchecks.io check using slug-based URLs.

    Args:
        slug: The check's slug identifier (e.g., "sync-rpa-extracts")
        signal: The signal type to send (default: SUCCESS)
        auto_provision: If True, creates the check if it doesn't exist

    Returns:
        True if the ping was successful, False otherwise

    Raises:
        requests.RequestException: If the request fails and should be retried
    """
    if not settings.HEALTHCHECKSIO_PING_KEY:
        logger.warning("healthcheck_ping_skipped reason=no_ping_key slug=%s", slug)
        return False

    # Prepend the environment name to the slug
    slug = f"{settings.ENVIRONMENT}-{slug}"

    # Build URL: https://hc-ping.com/<ping-key>/<slug>[/signal]
    url = f"https://hc-ping.com/{settings.HEALTHCHECKSIO_PING_KEY}/{slug}{signal.value}"
    params = {"create": "1"} if auto_provision else None

    try:
        response = requests.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        logger.info(
            "healthcheck_ping_success slug=%s signal=%s status_code=%s",
            slug,
            signal.name,
            response.status_code,
        )
        return True
    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response else None
        response_text = exc.response.text[:100] if exc.response else None
        logger.warning(
            "healthcheck_ping_failed slug=%s signal=%s status_code=%s response_text=%s",
            slug,
            signal.name,
            status_code,
            response_text,
        )
        return False
    except requests.RequestException as exc:
        logger.warning("healthcheck_ping_error slug=%s signal=%s error=%s", slug, signal.name, exc)
        # Re-raise for retry in Celery task
        raise
