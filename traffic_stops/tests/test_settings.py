"""Tests for settings configuration."""

import os

from unittest import mock

import pytest


@pytest.mark.parametrize(
    "custom_domain,media_location,expected_url",
    [
        # With custom domain and no location
        ("files.nccopwatch.org", "", "https://files.nccopwatch.org/"),
        # With custom domain and location
        ("files.nccopwatch.org", "media", "https://files.nccopwatch.org/media/"),
        # With custom domain and nested location
        ("files.example.com", "uploads/files", "https://files.example.com/uploads/files/"),
        # Without custom domain (local development)
        ("", "", "/media/"),
        (None, "", "/media/"),
    ],
)
def test_media_url_configuration(custom_domain, media_location, expected_url):
    """Test that MEDIA_URL is correctly set based on S3 configuration."""
    # Mock environment variables
    env_vars = {
        "MEDIA_S3_CUSTOM_DOMAIN": custom_domain or "",
        "MEDIA_LOCATION": media_location,
        "DEFAULT_FILE_STORAGE": "django.core.files.storage.FileSystemStorage",
    }

    with mock.patch.dict(os.environ, env_vars, clear=False):
        # Import settings module to trigger configuration
        # We need to reload to pick up the mocked environment
        import importlib

        from traffic_stops.settings import base

        importlib.reload(base)

        assert expected_url == base.MEDIA_URL


def test_media_url_with_s3_storage():
    """Test MEDIA_URL when using S3 storage backend."""
    env_vars = {
        "MEDIA_S3_CUSTOM_DOMAIN": "files.nccopwatch.org",
        "MEDIA_LOCATION": "",
        "DEFAULT_FILE_STORAGE": "traffic_stops.storages.MediaBoto3Storage",
    }

    with mock.patch.dict(os.environ, env_vars, clear=False):
        import importlib

        from traffic_stops.settings import base

        importlib.reload(base)

        # When S3 storage is configured with custom domain, MEDIA_URL should be absolute
        assert base.MEDIA_URL.startswith("https://")
        assert "files.nccopwatch.org" in base.MEDIA_URL
