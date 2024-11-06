import pytest

from nc import prime_cache


@pytest.fixture(autouse=True)
def group_urls():
    """Monkeypatch API_ENDPOINT_NAMES to return a single group URL for tests"""
    prime_cache.API_ENDPOINT_NAMES = ("nc:arrests-percentage-of-stops",)


class TestGetGroupUrls:
    def test_get_group_urls_empty_allowed_hosts(self, settings):
        settings.ALLOWED_HOSTS = []
        assert (
            prime_cache.get_group_urls(agency_id=99)[0]
            == "http://127.0.0.1:8000/api/agency/99/arrests-percentage-of-stops/"
        )

    def test_get_group_urls_allowed_hosts(self, settings):
        settings.ALLOWED_HOSTS = ["nccopwatch.org"]
        assert (
            prime_cache.get_group_urls(agency_id=99)[0]
            == "https://nccopwatch.org/api/agency/99/arrests-percentage-of-stops/"
        )

    def test_get_group_urls_officer_id(self):
        assert (
            prime_cache.get_group_urls(agency_id=99, officer_id=100)[0]
            == "https://testserver/api/agency/99/arrests-percentage-of-stops/?officer=100"
        )
