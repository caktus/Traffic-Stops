import datetime as dt

import pytest

from nc.models import DriverEthnicity, DriverRace, StopSummary
from nc.tests.factories import AgencyFactory, CountyFactory, NCCensusProfileFactory, PersonFactory
from nc.views.likelihood import county_agency_labels, likelihood_comparison


@pytest.fixture
def year_2023():
    return dt.date(2023, 6, 1)


@pytest.fixture
def durham_county():
    return CountyFactory(
        id="37063", county_name="Durham County", census_profile_id="0500000US37063"
    )


@pytest.fixture
def durham_agency(durham_county):
    return AgencyFactory(
        name="Durham Police Department",
        census_profile_id="1600000US3719000",
        county=durham_county,
    )


def _create_stops_and_census(agency, county, year_date):
    """Helper to create stops and census data for both agency and county levels."""
    # Agency-level ACS data (place geography)
    NCCensusProfileFactory(
        acs_id=agency.census_profile_id,
        race="Black",
        population=5000,
        population_total=20000,
        year=year_date.year,
    )
    NCCensusProfileFactory(
        acs_id=agency.census_profile_id,
        race="White",
        population=10000,
        population_total=20000,
        year=year_date.year,
    )
    # County-level ACS data (county geography)
    NCCensusProfileFactory(
        acs_id=county.census_profile_id,
        race="Black",
        population=8000,
        population_total=30000,
        year=year_date.year,
    )
    NCCensusProfileFactory(
        acs_id=county.census_profile_id,
        race="White",
        population=15000,
        population_total=30000,
        year=year_date.year,
    )
    # Create stops
    PersonFactory.create_batch(
        size=50,
        race=DriverRace.BLACK,
        ethnicity=DriverEthnicity.NON_HISPANIC,
        stop__agency=agency,
        stop__date=year_date,
    )
    PersonFactory.create_batch(
        size=30,
        race=DriverRace.WHITE,
        ethnicity=DriverEthnicity.NON_HISPANIC,
        stop__agency=agency,
        stop__date=year_date,
    )
    StopSummary.refresh()


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestLikelihoodComparison:
    def test_agency_level_returns_data(self, durham_agency, durham_county, year_2023):
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        assert not df.empty
        assert "agency_name_race" in df.columns
        assert set(df["level"]) == {"agency"}
        # Should have rows for both Black and White
        races = set(df["driver_race"])
        assert "Black" in races
        assert "White" in races

    def test_county_level_returns_data(self, durham_agency, durham_county, year_2023):
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        df = likelihood_comparison(level="county", year=2023)
        assert not df.empty
        assert set(df["level"]) == {"county"}
        assert "Durham County" in df["group_name"].values

    def test_empty_result(self):
        """No data returns empty DataFrame."""
        StopSummary.refresh()
        df = likelihood_comparison(level="agency", year=2099)
        assert df.empty

    def test_times_likely_white_is_one(self, durham_agency, durham_county, year_2023):
        """White drivers should have times_likely == 1.0 (baseline)."""
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        white = df[df["driver_race"] == "White"]
        for _, row in white.iterrows():
            assert row["times_likely"] == pytest.approx(1.0)

    def test_expected_columns(self, durham_agency, durham_county, year_2023):
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        expected = {
            "level",
            "group_id",
            "group_name",
            "census_profile_id",
            "year",
            "driver_race",
            "population",
            "total_population",
            "stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
            "times_likely",
            "agency_name_race",
        }
        assert set(df.columns) == expected

    def test_county_agency_labels(self, durham_agency, durham_county, year_2023):
        """county_agency_labels returns a county FIPS → agency text mapping."""
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        labels = county_agency_labels(race="Black", year=2023)
        assert "37063" in labels.index
        assert "Durham Police Department" in labels["37063"]

    def test_county_agency_labels_empty_when_no_data(self):
        """Returns empty Series when there are no stops."""
        StopSummary.refresh()
        labels = county_agency_labels(race="Black", year=2099)
        assert labels.empty
