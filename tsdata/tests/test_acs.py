import csv
import io
import zipfile

from unittest.mock import patch

import pandas as pd
import pytest

from django.test import TestCase

from nc.models import NCCensusProfile
from tsdata import acs


@pytest.fixture
def make_in_memory_zipped_csv():
    """Factory fixture to create an in-memory zipped CSV from a list of dicts."""

    def _builder(rows, filename="output", delimiter="\t"):
        # Handle a single dict by wrapping it in a list
        if isinstance(rows, dict):
            rows = [rows]

        # 1. Write CSV data to an in-memory string buffer
        csv_buffer = io.StringIO()
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames, delimiter=delimiter)
        writer.writeheader()
        writer.writerows(rows)

        # 2. Write the CSV string directly to into a zipfile in a in-memory bytes buffer
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"{filename}.txt", csv_buffer.getvalue())
        zip_buffer.seek(0)

        return zip_buffer

    return _builder


@pytest.fixture
def census_data_dir(tmp_path, settings):
    """Override CENSUS_DATA_DIR setting to use a temporary directory."""
    settings.CENSUS_DATA_DIR = tmp_path
    return tmp_path


class ACSTests(TestCase):
    expected_race_variables = [
        "total",
        "white",
        "black",
        "native_american",
        "asian",
        "native_hawaiian",
        "other",
        "two_or_more_races",
        "hispanic",
        "non_hispanic",
    ]

    def test_nc_variables(self):
        acs_obj = acs.ACS(key="", state_abbr="NC", year=2020)
        self.assertCountEqual(acs_obj.race_variables.values(), self.expected_race_variables)
        self.assertCountEqual(
            acs_obj.variables,
            [
                "NAME",
                "GEO_ID",
                "B03002_001E",
                "B03002_003E",
                "B03002_004E",
                "B03002_005E",
                "B03002_006E",
                "B03002_007E",
                "B03002_008E",
                "B03002_009E",
                "B03002_012E",
                "B03002_002E",
            ],
        )

    def test_other_state(self):
        with self.assertRaises(KeyError):
            acs.ACS(key="", state_abbr="NY", year=2020)


class TestACSCache:
    class DummyACS(acs.ACS):
        geography = "place"

        def call_api(self):
            row = {
                "NAME": "Durham city, North Carolina",
                "GEO_ID": "1600000US3719000",
            }
            for var in acs.NC_RACE_VARS:
                row[var] = "1"
            return [row]

    def test_get_writes_cache_file_when_missing(self, census_data_dir):
        acs_obj = self.DummyACS(key="", state_abbr="NC", year=2020)
        result = acs_obj.get()

        cached_file = census_data_dir / "acs_place_NC_2020.zip"
        assert cached_file.exists()
        assert result.iloc[0]["id"] == "1600000US3719000"

    def test_get_uses_cached_file_when_present(self, census_data_dir):
        cached_file = census_data_dir / "acs_place_NC_2020.zip"

        row = {
            "NAME": "Cached Durham",
            "GEO_ID": "1600000US3719000",
        }
        for var in acs.NC_RACE_VARS:
            row[var] = "1"
        pd.DataFrame([row]).to_json(cached_file, orient="records", compression="infer")

        acs_obj = self.DummyACS(key="", state_abbr="NC", year=2020)
        acs_obj.call_api = lambda: (_ for _ in ()).throw(AssertionError("should not call api"))
        result = acs_obj.get()

        assert result.iloc[0]["location"] == "Cached Durham"


class GazetteerTests:
    def test_get_gazetteer_coordinates_unknown_geography(self):
        result = acs.get_gazetteer_coordinates(2021, "unknown")
        assert result.empty
        assert list(result.columns) == ["id", "latitude", "longitude"]

    def test_get_gazetteer_coordinates_place(self, make_in_memory_zipped_csv, census_data_dir):
        """Test reading place-level gazetteer data from a real zipped CSV."""
        sample_data = {
            "GEOID": "3719000",
            "INTPTLAT": "35.9940",
            "INTPTLONG": "-78.8986",
            "NAME": "Durham",
        }

        zip_stream = make_in_memory_zipped_csv(sample_data, filename="2021_Gaz_place_national")
        zip_path = census_data_dir / "2021_Gaz_place_national.zip"
        zip_path.write_bytes(zip_stream.getvalue())

        result = acs.get_gazetteer_coordinates(2021, "place")

        assert list(result.columns) == ["id", "latitude", "longitude"]
        assert result.iloc[0]["id"] == "1600000US3719000"
        assert result.iloc[0]["latitude"] == 35.9940
        assert result.iloc[0]["longitude"] == -78.8986

    def test_get_gazetteer_coordinates_place_latin1(self, census_data_dir):
        """Test fallback to latin-1 for older Gazetteer files."""
        zip_path = census_data_dir / "2013_Gaz_place_national.zip"
        csv_text = "GEOID\tINTPTLAT\tINTPTLONG\tNAME\n3719000\t35.9940\t-78.8986\tPe\xf1a\n"

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("2013_Gaz_place_national.txt", csv_text.encode("latin-1"))

        result = acs.get_gazetteer_coordinates(2013, "place")

        assert result.iloc[0]["id"] == "1600000US3719000"
        assert result.iloc[0]["latitude"] == 35.9940
        assert result.iloc[0]["longitude"] == -78.8986


class RefreshCensusModelsTests(TestCase):
    databases = "__all__"

    def test_refresh_populates_lat_lng(self):
        data = [
            {
                "id": "1600000US3719000",
                "location": "Durham",
                "geography": "place",
                "state": "NC",
                "source": "ACS",
                "year": 2021,
                "white": 100,
                "black": 50,
                "native_american": 0,
                "asian": 10,
                "native_hawaiian": 0,
                "other": 0,
                "two_or_more_races": 0,
                "hispanic": 20,
                "non_hispanic": 140,
                "total": 160,
                "latitude": 35.9940,
                "longitude": -78.8986,
            }
        ]
        acs.refresh_census_models(data)

        profile = NCCensusProfile.objects.filter(acs_id="1600000US3719000").first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.latitude, 35.9940)
        self.assertEqual(profile.longitude, -78.8986)


class TestGetStateCensusData:
    def _make_dummy_df(self, geo_id, geography, year):
        return pd.DataFrame(
            [
                {
                    "id": geo_id,
                    "location": "Durham",
                    "geography": geography,
                    "state": "NC",
                    "source": "ACS 5-Year Data",
                    "year": year,
                    "total": 100,
                    "white": 60,
                    "black": 20,
                    "native_american": 0,
                    "asian": 5,
                    "native_hawaiian": 0,
                    "other": 5,
                    "two_or_more_races": 5,
                    "hispanic": 5,
                    "non_hispanic": 95,
                }
            ]
        )

    def test_get_state_census_data_merges_lat_lon(self):
        """get_state_census_data returns a DataFrame with latitude/longitude merged in."""
        years = [2020, 2021]

        def make_get(geography):
            def _get(self_inner):
                return self._make_dummy_df("1600000US3719000", geography, self_inner.year)

            return _get

        def fake_add_coords(df):
            df = df.copy()
            df["latitude"] = 35.9940
            df["longitude"] = -78.8986
            return df

        with (
            patch("census.core.ACS5Client.years", new=years),
            patch.object(acs.ACSState, "get", make_get("state")),
            patch.object(acs.ACSStateCounties, "get", make_get("county")),
            patch.object(acs.ACSStatePlaces, "get", make_get("place")),
            patch.object(acs, "add_gazetteer_coordinates", side_effect=fake_add_coords),
        ):
            result = acs.get_state_census_data(key="fake-key")

        # 1 state × 2 years × 3 geographies = 6 rows
        assert len(result) == 6
        assert (result["latitude"] == 35.9940).all()
        assert (result["longitude"] == -78.8986).all()
