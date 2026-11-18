from unittest.mock import patch

import pytest

from django.core.management import call_command
from django.core.management.base import CommandError


@pytest.mark.django_db
class TestImportCensusApiKey:
    def test_use_api_without_key_raises_command_error(self, settings):
        settings.CENSUS_API_KEY = ""
        with (
            patch("tsdata.management.commands.import_census.acs.get_state_census_data"),
            pytest.raises(CommandError) as excinfo,
        ):
            call_command("import_census", api=True)
        assert "CENSUS_API_KEY" in str(excinfo.value)
        assert "https://api.census.gov/data/key_signup.html" in str(excinfo.value)

    def test_use_api_without_key_does_not_download(self, settings):
        settings.CENSUS_API_KEY = ""
        with (
            patch("tsdata.management.commands.import_census.acs.get_state_census_data") as mock_get,
            pytest.raises(CommandError),
        ):
            call_command("import_census", api=True)
        mock_get.assert_not_called()

    def test_non_api_path_works_without_key(self, settings):
        """The default S3 JSON path requires no API key."""
        settings.CENSUS_API_KEY = ""

        class FakeResponse:
            status_code = 200

            def json(self):
                return [{"NAME": "x", "GEO_ID": "y"}]

        with (
            patch("requests.get", return_value=FakeResponse()) as mock_get,
            patch("tsdata.acs.refresh_census_models") as mock_refresh,
        ):
            call_command("import_census")
        mock_get.assert_called_once()
        mock_refresh.assert_called_once()
