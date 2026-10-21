import datetime as dt

import pytest

from django.urls import reverse

from nc.models import (
    DisparityCategory,
    DriverEthnicity,
    DriverRace,
    LikelihoodOfStopSummary,
    StopSummary,
)
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


@pytest.fixture
def small_agency_data(disparity_data):
    """Add sub-threshold (< 10,000 population) police and sheriff agencies."""
    small_kwargs = {"black_stops": 120, "white_stops": 40, "black_pop": 2000, "white_pop": 5000}
    small_police = _create_agency_data(
        name="Tinytown Police Department",
        acs_id="1600000US3770000",
        total_pop=8000,
        **small_kwargs,
    )
    small_sheriff = _create_agency_data(
        name="Tiny County Sheriff",
        acs_id="0500000US37001",
        total_pop=8000,
        **small_kwargs,
    )
    StopSummary.refresh()
    LikelihoodOfStopSummary.refresh()
    return {"small_police": small_police, "small_sheriff": small_sheriff}


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
            "agency_name_race",
            "driver_race",
            "population",
            "total_population",
            "stops",
            "total_stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
            "times_likely",
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

    def test_sub_threshold_status_returned(self, client, small_agency_data):
        """The map legend toggle filters on status."""
        response = client.get(reverse("nc:disparity-sheriffs"), {"race": "Black"})
        statuses = {s["group_name"]: s["status"] for s in response.json()["sheriffs"]}
        assert statuses["Tiny County Sheriff"] == "small_population"
        assert statuses["Durham County Sheriff"] == "active"

    def test_zero_race_population_excluded(self, client, disparity_data):
        """A race with 0 population has no stop rate (NaN); it must not break JSON rendering."""
        _create_agency_data(
            name="Zero County Sheriff",
            acs_id="0500000US37002",
            black_stops=120,
            white_stops=40,
            black_pop=0,
            white_pop=5000,
            total_pop=8000,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        response = client.get(reverse("nc:disparity-sheriffs"), {"race": "Black", "year": YEAR})
        assert response.status_code == 200
        names = {s["group_name"] for s in response.json()["sheriffs"]}
        assert "Zero County Sheriff" not in names
        assert "Durham County Sheriff" in names


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
        assert row["disparity_category"] in set(DisparityCategory.values)
        assert row["small_population"] is False

    def test_total_stops_is_agency_total_not_race_subset(self, client, disparity_data):
        """Bubble size uses total_stops, which must cover all races for the agency."""
        response = client.get(reverse("nc:disparity-police"), {"race": "Black"})
        row = next(
            a for a in response.json()["agencies"] if a["group_name"] == "Durham Police Department"
        )
        # Fixture: 150 Black + 50 White stops.
        assert row["stops"] == 150
        assert row["total_stops"] == 200

    def test_sub_threshold_agencies_flagged(self, client, small_agency_data):
        """The map legend toggle filters on small_population."""
        response = client.get(reverse("nc:disparity-police"), {"race": "Black"})
        flags = {a["group_name"]: a["small_population"] for a in response.json()["agencies"]}
        assert flags["Tinytown Police Department"] is True
        assert flags["Durham Police Department"] is False

    def test_zero_race_population_excluded(self, client, small_agency_data):
        """A race with 0 population has no stop rate (NaN); it must not break JSON rendering."""
        _create_agency_data(
            name="Zeroville Police Department",
            acs_id="1600000US3780000",
            black_stops=120,
            white_stops=40,
            black_pop=0,
            white_pop=5000,
            total_pop=8000,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        response = client.get(reverse("nc:disparity-police"), {"race": "Black", "year": YEAR})
        assert response.status_code == 200
        names = {a["group_name"] for a in response.json()["agencies"]}
        assert "Zeroville Police Department" not in names
        assert "Tinytown Police Department" in names


class TestDisparityCategory:
    """Tests for DisparityCategory.categorize bucketing."""

    @pytest.mark.parametrize(
        ("times_likely", "expected"),
        [
            (0.5, DisparityCategory.EQUITY),
            (1.0, DisparityCategory.EQUITY),
            (1.5, DisparityCategory.LOW),
            (2.0, DisparityCategory.LOW),
            (2.5, DisparityCategory.MODERATE),
            (3.0, DisparityCategory.MODERATE),
            (4.2, DisparityCategory.SEVERE),
        ],
    )
    def test_categorize(self, times_likely: float, expected: DisparityCategory):
        assert DisparityCategory.categorize(times_likely) == expected


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestDisparityParamValidation:
    """Invalid query params on disparity endpoints return 400 with field errors."""

    @pytest.mark.parametrize(
        ("url", "params", "field"),
        [
            ("nc:disparity-agencies", {"year": "abc"}, "year"),
            ("nc:disparity-agencies", {"year": "1850"}, "year"),
            ("nc:disparity-agencies", {"race": "green"}, "race"),
            ("nc:disparity-agencies", {"limit": "0"}, "limit"),
            ("nc:disparity-agencies", {"limit": "1001"}, "limit"),
            ("nc:disparity-sheriffs", {"year": "abc"}, "year"),
            ("nc:disparity-police", {"race": "green"}, "race"),
            ("nc:disparity-parity", {"limit": "1001"}, "limit"),
        ],
    )
    def test_invalid_params_return_400(self, client, url, params, field):
        response = client.get(reverse(url), params)
        assert response.status_code == 400
        assert field in response.json()

    def test_missing_params_default_to_all_years_black(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-agencies"))
        assert response.status_code == 200
        body = response.json()
        assert body["year"] is None
        assert body["race"] == "Black"
        assert len(body["agencies"]) > 0

    def test_valid_limit_accepted(self, client, disparity_data):
        response = client.get(reverse("nc:disparity-agencies"), {"limit": 1})
        assert response.status_code == 200
        assert len(response.json()["agencies"]) == 1


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
            "total_stops",
            "pop_share",
            "stop_share",
            "excess_stops",
            "stop_rate_ratio",
        }
        assert expected_keys == set(row.keys())

    def test_group_id_identifies_agencies(self, client, disparity_data):
        """group_id is what the scatter plot uses to link points to agency dashboards."""
        response = client.get(reverse("nc:disparity-parity"), {"race": "Black"})
        agencies = response.json()["agencies"]
        expected = {str(a.pk): a.name for a in disparity_data.values()}
        assert {str(a["group_id"]): a["agency_name"] for a in agencies} == expected
