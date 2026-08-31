import datetime as dt

import pytest

from django.urls import reverse

from nc.models import DriverEthnicity, DriverRace, LikelihoodOfStopSummary, StopSummary
from nc.tests.factories import AgencyFactory, NCCensusProfileFactory, PersonFactory

YEAR = 2023
YEAR_DATE = dt.date(YEAR, 6, 1)


def _create_agency_data(
    name,
    acs_id,
    black_stops,
    white_stops,
    black_pop=5000,
    white_pop=10000,
    total_pop=20000,
    latitude=35.99,
    longitude=-78.9,
):
    """Create an agency with per-race census profiles and stop records."""
    agency = AgencyFactory(name=name, census_profile_id=acs_id)
    NCCensusProfileFactory(
        acs_id=acs_id,
        race="Black",
        population=black_pop,
        population_total=total_pop,
        year=YEAR,
        latitude=latitude,
        longitude=longitude,
    )
    NCCensusProfileFactory(
        acs_id=acs_id,
        race="White",
        population=white_pop,
        population_total=total_pop,
        year=YEAR,
        latitude=latitude,
        longitude=longitude,
    )
    PersonFactory.create_batch(
        size=black_stops,
        race=DriverRace.BLACK,
        ethnicity=DriverEthnicity.NON_HISPANIC,
        stop__agency=agency,
        stop__date=YEAR_DATE,
    )
    PersonFactory.create_batch(
        size=white_stops,
        race=DriverRace.WHITE,
        ethnicity=DriverEthnicity.NON_HISPANIC,
        stop__agency=agency,
        stop__date=YEAR_DATE,
    )
    return agency


@pytest.fixture
def disparity_data(db):
    """Build a police department and a sheriff's office with disparities, then refresh views."""
    # Durham PD: Black drivers stopped at a much higher rate than White.
    police = _create_agency_data(
        name="Durham Police Department",
        acs_id="1600000US3719000",
        black_stops=150,
        white_stops=50,
    )
    # Durham County Sheriff: county ACS id (FIPS 063 in the trailing digits).
    sheriff = _create_agency_data(
        name="Durham County Sheriff",
        acs_id="0500000US37063",
        black_stops=120,
        white_stops=60,
    )
    StopSummary.refresh()
    LikelihoodOfStopSummary.refresh()
    return {"police": police, "sheriff": sheriff}


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestDisparityYears:
    def test_returns_available_years(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-years"))
        assert response.status_code == 200
        assert response.json()["years"] == [YEAR]


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestTopAgencies:
    def test_limit_and_shape(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-agencies"), {"race": "Black", "limit": 5})
        assert response.status_code == 200
        payload = response.json()
        assert payload["race"] == "Black"
        agencies = payload["agencies"]
        assert 0 < len(agencies) <= 5
        expected_keys = {
            "group_id",
            "group_name",
            "times_likely",
            "stop_rate_ratio",
            "stops",
            "population",
        }
        assert expected_keys == set(agencies[0].keys())

    def test_ordered_by_times_likely_desc(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-agencies"), {"race": "Black"})
        values = [a["times_likely"] for a in response.json()["agencies"]]
        assert values == sorted(values, reverse=True)
        # Police department (higher disparity) ranks above the sheriff's office.
        assert values[0] > 1.0


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestSheriffDisparity:
    def test_only_sheriffs_with_fips(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-sheriffs"), {"race": "Black"})
        assert response.status_code == 200
        sheriffs = response.json()["sheriffs"]
        assert len(sheriffs) == 1
        row = sheriffs[0]
        assert row["fips3"] == "063"
        assert row["group_name"] == "Durham County Sheriff"
        assert row["status"] == "active"


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestPoliceDisparity:
    def test_only_non_sheriffs_with_category(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-police"), {"race": "Black"})
        assert response.status_code == 200
        agencies = response.json()["agencies"]
        names = {a["group_name"] for a in agencies}
        assert "Durham Police Department" in names
        assert "Durham County Sheriff" not in names
        row = next(a for a in agencies if a["group_name"] == "Durham Police Department")
        assert row["latitude"] is not None
        assert row["longitude"] is not None
        assert row["disparity_category"] in {
            "≤ 1.0 (Equity)",
            "1.0 - 2.0",
            "2.0 - 3.0",
            "≥ 3.0 (Severe)",
        }
        assert row["small_population"] is False


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestParity:
    def test_race_and_white_rows(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-parity"), {"race": "Black"})
        assert response.status_code == 200
        agencies = response.json()["agencies"]
        assert {a["driver_race"] for a in agencies} == {"Black", "White"}
        row = agencies[0]
        expected_keys = {
            "group_id",
            "agency_name",
            "driver_race",
            "population",
            "total_population",
            "stops",
            "pop_share",
            "stop_share",
            "excess_stops",
            "stop_rate_ratio",
        }
        assert expected_keys == set(row.keys())
