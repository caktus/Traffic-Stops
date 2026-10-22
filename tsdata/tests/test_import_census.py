import json

from unittest.mock import patch

import pandas as pd
import pytest

from django.core.management import CommandError, call_command


@pytest.mark.parametrize("key", ["", None])
def test_use_api_without_key_raises_command_error(settings, key):
    settings.CENSUS_API_KEY = key
    with patch("tsdata.acs.get_state_census_data") as get_data:
        with pytest.raises(CommandError, match="CENSUS_API_KEY is not set"):
            call_command("import_census", "--use-api", "--output")
    get_data.assert_not_called()


def test_use_api_with_key_passes_key_to_census(settings, capsys):
    settings.CENSUS_API_KEY = "fake-key"
    df = pd.DataFrame([{"id": "0400000US37", "location": "North Carolina"}])
    with patch("tsdata.acs.get_state_census_data", return_value=df) as get_data:
        call_command("import_census", "--use-api", "--output")
    get_data.assert_called_once_with(key="fake-key")
    assert json.loads(capsys.readouterr().out) == [
        {"id": "0400000US37", "location": "North Carolina"}
    ]
