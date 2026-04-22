import datetime as dt

import pandas as pd
import pytest

from nc.models import DriverEthnicity, DriverRace, StopSummary
from nc.tests.factories import AgencyFactory, CountyFactory, NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import county_agency_labels, likelihood_comparison, likelihood_stop_query


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
        """county_agency_labels returns a DataFrame with agency stop rate data per county."""
        _create_stops_and_census(durham_agency, durham_county, year_2023)
        df = county_agency_labels(race="Black", year=2023)
        assert not df.empty
        assert set(df.columns) == {
            "county_id",
            "county_name",
            "driver_race",
            "agency",
            "population",
            "total_population",
            "stops",
            "stop_rate",
            "times_likely",
            "times_likely_county_average",
            "county_population",
        }
        assert "37063" in df["county_id"].values
        # Filter to Black rows for per-race assertions
        row = df[(df["county_id"] == "37063") & (df["driver_race"] == "Black")].iloc[0]
        assert row["agency"] == "Durham Police Department"
        assert row["county_name"] == "Durham County"
        assert row["population"] > 0
        assert row["stops"] > 0
        assert row["stop_rate"] > 0
        assert row["times_likely"] > 0
        assert row["times_likely_county_average"] > 0
        assert row["county_population"] > 0
        # White rows should also be present
        assert "White" in df[df["county_id"] == "37063"]["driver_race"].values

    def test_county_agency_labels_empty_when_no_data(self):
        """Returns empty DataFrame when there are no stops."""
        StopSummary.refresh()
        df = county_agency_labels(race="Black", year=2099)
        assert df.empty
        assert set(df.columns) == {
            "county_id",
            "county_name",
            "driver_race",
            "agency",
            "population",
            "total_population",
            "stops",
            "stop_rate",
            "times_likely",
            "times_likely_county_average",
            "county_population",
        }


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestCountyAggregation:
    """
    County-level stop rate aggregation combines stops from all agencies in a county
    against the county-level census population (not agency-level ACS).
    """

    def test_two_agencies_combined_for_county_rate(self, durham_county, year_2023):
        """
        Durham Police Department (high stop rate, ~2.2x) and Durham County Sheriff's
        Office (lower stop rate, ~1.6x) are both in Durham County. The county-level
        rate combines their stops against county census population (~1.9x).

        DPD:    110 Black stops / 5000 pop -> 0.022 rate (2.2x White)
        Sheriff:  80 Black stops / 5000 pop -> 0.016 rate (1.6x White)
        County: 190 Black stops / 10000 pop -> 0.019 rate (1.9x White)
        White baseline (both agencies): 50 stops / 5000 pop -> 0.010
        County White: 100 stops / 10000 pop -> 0.010
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        sheriff = AgencyFactory(
            name="Durham County Sheriff's Office",
            census_profile_id="1600000US3719001",
            county=durham_county,
        )
        # Agency-level ACS (5000 Black / 5000 White per agency)
        for acs_id in [dpd.census_profile_id, sheriff.census_profile_id]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
        # County-level ACS (used for county aggregate)
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        # DPD: 110 Black + 50 White stops -> Black rate 0.022 (2.2x White rate 0.010)
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        # Sheriff: 80 Black + 50 White stops -> Black rate 0.016 (1.6x White rate 0.010)
        PersonFactory.create_batch(
            80,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df = likelihood_comparison(level="county", year=2023)
        durham = df[df["group_name"] == "Durham County"]
        assert not durham.empty
        black = durham[durham["driver_race"] == "Black"].iloc[0]
        white = durham[durham["driver_race"] == "White"].iloc[0]

        # County totals combine both agencies
        assert black["stops"] == 190  # DPD(110) + Sheriff(80)
        assert white["stops"] == 100  # DPD(50) + Sheriff(50)

        # County rates use county ACS population, not agency ACS
        # Black: 190 / 10000 = 0.019
        assert black["stop_rate"] == pytest.approx(0.019)
        # White: 100 / 10000 = 0.010
        assert white["stop_rate"] == pytest.approx(0.010)

        # County aggregate: Black drivers 1.9x more likely — between DPD (2.2x) and Sheriff (1.6x)
        assert black["times_likely"] == pytest.approx(1.9)

    def test_county_agency_labels_times_likely_county_average(self, durham_county, year_2023):
        """
        times_likely_county_average in county_agency_labels should match the county-level
        times_likely from likelihood_comparison(level='county').

        DPD:    110 Black / 5000 pop (2.2x), Sheriff: 80 Black / 5000 pop (1.6x)
        County average from agency data: 190/10000 / (100/10000) = 1.9x
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        sheriff = AgencyFactory(
            name="Durham County Sheriff's Office",
            census_profile_id="1600000US3719001",
            county=durham_county,
        )
        for acs_id in [dpd.census_profile_id, sheriff.census_profile_id]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            80,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df_labels = county_agency_labels(race="Black", year=2023)
        df_county = likelihood_comparison(level="county", year=2023)

        durham_labels = df_labels[df_labels["county_id"] == "37063"]
        assert not durham_labels.empty
        # All rows in the same county share the same county average (regardless of race)
        avg = durham_labels["times_likely_county_average"].iloc[0]
        assert (durham_labels["times_likely_county_average"] == avg).all()

        # The county average from agency data should match the county-level comparison
        county_black = df_county[
            (df_county["group_name"] == "Durham County") & (df_county["driver_race"] == "Black")
        ].iloc[0]
        assert avg == pytest.approx(county_black["times_likely"])

    def test_times_likely_county_average_uses_county_acs_not_agency_sum(
        self, durham_county, year_2023
    ):
        """
        times_likely_county_average must use the county ACS population, not the
        sum of agency ACS populations. The two differ in real data (a city's ACS
        coverage is smaller than the whole county).

        Agency ACS:  Black=3000, White=4000 each (total_pop=20000)
        County ACS:  Black=8000, White=9000 (total_pop=40000)  <- different denominator

        Sum-of-agency formula: (190/6000) / (100/8000) = 2.53x  (wrong)
        County ACS formula:    (190/8000) / (100/9000) = 2.14x  (correct)
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        sheriff = AgencyFactory(
            name="Durham County Sheriff's Office",
            census_profile_id="1600000US3719001",
            county=durham_county,
        )
        for acs_id, black_pop, white_pop in [
            (dpd.census_profile_id, 3000, 4000),
            (sheriff.census_profile_id, 3000, 4000),
        ]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=black_pop,
                population_total=20000,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=white_pop,
                population_total=20000,
                year=year_2023.year,
            )
        # County ACS uses different (larger) population counts
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=8000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=9000,
            population_total=40000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            80,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df_labels = county_agency_labels(race="Black", year=2023)
        df_county = likelihood_comparison(level="county", year=2023)

        durham_labels = df_labels[df_labels["county_id"] == "37063"]
        county_black = df_county[
            (df_county["group_name"] == "Durham County") & (df_county["driver_race"] == "Black")
        ].iloc[0]

        # times_likely_county_average must match the county comparison (county ACS denominator)
        avg = durham_labels["times_likely_county_average"].iloc[0]
        assert avg == pytest.approx(county_black["times_likely"])
        # Confirm it equals (190/8000) / (100/9000) = 2.1375, not the agency-sum formula
        expected = (190 / 8000) / (100 / 9000)
        assert avg == pytest.approx(expected)

    def test_agency_rates_differ_from_county_rate(self, durham_county, year_2023):
        """
        Each agency's individual times_likely differs but the county aggregate
        blends their combined stops, landing between the two.

        DPD:    110 Black / 5000 pop = 0.022 rate -> 2.2x (White 50/5000 = 0.010)
        Sheriff:  80 Black / 5000 pop = 0.016 rate -> 1.6x (White 50/5000 = 0.010)
        County: 190 Black / 10000 pop = 0.019 rate -> 1.9x (White 100/10000 = 0.010)
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        sheriff = AgencyFactory(
            name="Durham County Sheriff's Office",
            census_profile_id="1600000US3719001",
            county=durham_county,
        )
        for acs_id in [dpd.census_profile_id, sheriff.census_profile_id]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        # DPD: 110 Black / 5000 = 0.022 rate (2.2x White 0.010)
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        # Sheriff: 80 Black / 5000 = 0.016 rate (1.6x White 0.010)
        PersonFactory.create_batch(
            80,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df_agency = likelihood_comparison(level="agency", year=2023)
        dpd_black = df_agency[
            (df_agency["group_name"] == "Durham Police Department")
            & (df_agency["driver_race"] == "Black")
        ].iloc[0]
        sheriff_black = df_agency[
            (df_agency["group_name"] == "Durham County Sheriff's Office")
            & (df_agency["driver_race"] == "Black")
        ].iloc[0]

        # DPD: ~2.2x more likely; Sheriff: ~1.6x more likely
        assert dpd_black["times_likely"] == pytest.approx(2.2)
        assert sheriff_black["times_likely"] == pytest.approx(1.6)
        assert dpd_black["times_likely"] > sheriff_black["times_likely"]

        df_county = likelihood_comparison(level="county", year=2023)
        county_black = df_county[
            (df_county["group_name"] == "Durham County") & (df_county["driver_race"] == "Black")
        ].iloc[0]

        # County aggregate: 1.9x — between DPD (2.2x) and Sheriff (1.6x)
        assert county_black["times_likely"] == pytest.approx(1.9)
        assert (
            sheriff_black["times_likely"] < county_black["times_likely"] < dpd_black["times_likely"]
        )

    def test_small_city_agency_excluded_from_county_aggregate(self, durham_county, year_2023):
        """
        A small city agency (population < 10,000) is excluded from both
        agency-level and county-level results. Without this fix the county
        aggregate inflates by including stops from agencies that are invisible
        at the agency level because they fail the population filter.

        Sheriff (large, pop=10k):  110 Black + 50 White stops → 2.2x
        Small city (pop=2k):        50 Black + 10 White stops → would inflate county
        County should only reflect the Sheriff's stops (2.2x), not the small city's.
        """
        sheriff = AgencyFactory(
            name="Durham County Sheriff's Office",
            census_profile_id="1600000US3719001",
            county=durham_county,
        )
        small_city = AgencyFactory(
            name="Small City PD",
            census_profile_id="1600000US3719002",
            county=durham_county,
        )
        # Sheriff passes the population filter (total_population > 10,000)
        for race, pop in [("Black", 5000), ("White", 5000)]:
            NCCensusProfileFactory(
                acs_id=sheriff.census_profile_id,
                race=race,
                population=pop,
                population_total=20000,
                year=year_2023.year,
            )
        # Small city fails the filter (total_population <= 10,000)
        for race, pop in [("Black", 400), ("White", 1600)]:
            NCCensusProfileFactory(
                acs_id=small_city.census_profile_id,
                race=race,
                population=pop,
                population_total=2000,
                year=year_2023.year,
            )
        # County ACS
        for race, pop in [("Black", 5000), ("White", 5000)]:
            NCCensusProfileFactory(
                acs_id=durham_county.census_profile_id,
                race=race,
                population=pop,
                population_total=20000,
                year=year_2023.year,
            )
        # Sheriff: 110 Black + 50 White
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        # Small city: 50 Black + 10 White — should NOT inflate county total
        PersonFactory.create_batch(
            50,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=small_city,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=small_city,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        # Small city should be absent from agency-level results (fails population filter)
        df_agency = likelihood_comparison(level="agency", year=2023)
        assert "Small City PD" not in df_agency["group_name"].values

        # County aggregate should only include Sheriff's stops
        df_county = likelihood_comparison(level="county", year=2023)
        durham_black = df_county[
            (df_county["group_name"] == "Durham County") & (df_county["driver_race"] == "Black")
        ].iloc[0]
        # 110 Black / 5000 pop / (50 White / 5000 pop) = 2.2x
        assert durham_black["stops"] == 110
        assert durham_black["times_likely"] == pytest.approx(2.2)

    def test_county_agency_labels_includes_all_races(self, durham_county, year_2023):
        """
        county_agency_labels returns rows for ALL races, not just the requested race.
        The ``race`` parameter only controls which agencies are selected as top-N.
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        for acs_id in [dpd.census_profile_id]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=5000,
                population_total=20000,
                year=year_2023.year,
            )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df = county_agency_labels(race="Black", year=2023)
        durham_rows = df[df["county_id"] == "37063"]
        assert not durham_rows.empty
        races_present = set(durham_rows["driver_race"].unique())
        assert "Black" in races_present
        assert "White" in races_present

    def test_county_agency_labels_county_population_column(self, durham_county, year_2023):
        """
        county_population reflects the county-level ACS population for each race row,
        not the agency-level ACS population.
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        # Agency ACS: 5000 Black, 5000 White
        for race, pop in [("Black", 5000), ("White", 5000)]:
            NCCensusProfileFactory(
                acs_id=dpd.census_profile_id,
                race=race,
                population=pop,
                population_total=20000,
                year=year_2023.year,
            )
        # County ACS: 8000 Black, 9000 White  (different from agency)
        for race, pop in [("Black", 8000), ("White", 9000)]:
            NCCensusProfileFactory(
                acs_id=durham_county.census_profile_id,
                race=race,
                population=pop,
                population_total=40000,
                year=year_2023.year,
            )
        PersonFactory.create_batch(
            50,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df = county_agency_labels(race="Black", year=2023)
        durham = df[df["county_id"] == "37063"]

        black_row = durham[durham["driver_race"] == "Black"].iloc[0]
        white_row = durham[durham["driver_race"] == "White"].iloc[0]

        # county_population uses county ACS (not agency ACS)
        assert black_row["county_population"] == 8000
        assert white_row["county_population"] == 9000
        # population column still holds agency ACS
        assert black_row["population"] == 5000
        assert white_row["population"] == 5000

    def test_county_agency_labels_accepts_county_df(self, durham_county, year_2023):
        """
        Passing county_df returns the same result as the default (which fetches it
        internally), and avoids a redundant likelihood_comparison call.
        """
        dpd = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        for race, pop in [("Black", 5000), ("White", 5000)]:
            NCCensusProfileFactory(
                acs_id=dpd.census_profile_id,
                race=race,
                population=pop,
                population_total=20000,
                year=year_2023.year,
            )
        for race, pop in [("Black", 8000), ("White", 9000)]:
            NCCensusProfileFactory(
                acs_id=durham_county.census_profile_id,
                race=race,
                population=pop,
                population_total=40000,
                year=year_2023.year,
            )
        PersonFactory.create_batch(
            50,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=dpd,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df_county = likelihood_comparison(level="county", year=2023)
        df_with = county_agency_labels(race="Black", year=2023, county_df=df_county)
        df_without = county_agency_labels(race="Black", year=2023)

        # Results should be identical regardless of whether county_df is provided
        df_with_sorted = df_with.sort_values(["county_id", "driver_race", "agency"]).reset_index(
            drop=True
        )
        df_without_sorted = df_without.sort_values(
            ["county_id", "driver_race", "agency"]
        ).reset_index(drop=True)
        pd.testing.assert_frame_equal(df_with_sorted, df_without_sorted)


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestMatchesLikelihoodStopQuery:
    """
    likelihood_stop_query (used by the per-agency chart) and
    likelihood_comparison(level='agency') should produce the same stop_rate
    and baseline_rate values when given the same inputs.

    Note: likelihood_stop_query returns stop_rate_ratio = stop_rate / baseline_rate,
    which corresponds to times_likely in likelihood_comparison.
    """

    def test_stop_rates_match_for_same_year(self, rf, year_2023):
        """
        With a single year of ACS data (so the view's AVG equals the year value),
        both functions compute identical stop_rate and baseline_rate.

        DPD: 110 Black stops / 5000 pop = 0.022 stop_rate (2.2x White)
             50 White stops / 5000 pop = 0.010 baseline_rate
        stop_rate_ratio (likelihood_stop_query) == times_likely (likelihood_comparison) = 2.2
        """
        durham_county = CountyFactory(
            id="37063", county_name="Durham County", census_profile_id="0500000US37063"
        )
        agency = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        # Single year of ACS ensures view AVG equals the year-specific value
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="Black",
            population=5000,
            population_total=20000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="White",
            population=5000,
            population_total=20000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="Black",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_county.census_profile_id,
            race="White",
            population=10000,
            population_total=40000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        # likelihood_stop_query (chart data)
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[agency.id], query_kwargs={"year": year_2023.year}
        )
        chart_df = likelihood_stop_query(request=rf.get(url), agency_id=agency.id)

        # likelihood_comparison (notebook/comparison data)
        comp_df = likelihood_comparison(level="agency", year=year_2023.year)
        agency_rows = comp_df[comp_df["group_id"] == str(agency.id)]

        for race in ["Black", "White"]:
            chart_row = chart_df[chart_df["race"] == race].iloc[0]
            comp_row = agency_rows[agency_rows["driver_race"] == race].iloc[0]

            # stop_rate and baseline_rate should be identical
            assert chart_row["stop_rate"] == pytest.approx(comp_row["stop_rate"]), (
                f"stop_rate mismatch for {race}"
            )
            assert chart_row["baseline_rate"] == pytest.approx(comp_row["baseline_rate"]), (
                f"baseline_rate mismatch for {race}"
            )

        # chart stop_rate_ratio == comparison times_likely (both = stop_rate / baseline_rate)
        black_chart = chart_df[chart_df["race"] == "Black"].iloc[0]
        black_comp = agency_rows[agency_rows["driver_race"] == "Black"].iloc[0]
        assert black_chart["stop_rate_ratio"] == pytest.approx(black_comp["times_likely"])
        # 110/5000 / (50/5000) = 0.022 / 0.010 = 2.2
        assert black_chart["stop_rate_ratio"] == pytest.approx(110 / 5000 / (50 / 5000))

    def test_stop_rates_match_averaged_across_years(self, rf, year_2023):
        """
        Without a year filter, both functions average stops across years.
        Both should produce the same stop_rate and baseline_rate.

        Year 2022: 110 Black + 50 White stops
        Year 2023: 130 Black + 70 White stops
        Average Black: 120 stops / 5000 pop = 0.024 (2.0x White)
        Average White:  60 stops / 5000 pop = 0.012 baseline_rate
        """
        year_2022 = dt.date(2022, 6, 1)
        durham_county = CountyFactory(
            id="37063", county_name="Durham County", census_profile_id="0500000US37063"
        )
        agency = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
            county=durham_county,
        )
        for year in [year_2022.year, year_2023.year]:
            NCCensusProfileFactory(
                acs_id=agency.census_profile_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=year,
            )
            NCCensusProfileFactory(
                acs_id=agency.census_profile_id,
                race="White",
                population=5000,
                population_total=20000,
                year=year,
            )
            NCCensusProfileFactory(
                acs_id=durham_county.census_profile_id,
                race="Black",
                population=10000,
                population_total=40000,
                year=year,
            )
            NCCensusProfileFactory(
                acs_id=durham_county.census_profile_id,
                race="White",
                population=10000,
                population_total=40000,
                year=year,
            )
        # Year 2022: 110 Black + 50 White
        PersonFactory.create_batch(
            110,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        # Year 2023: 130 Black + 70 White
        PersonFactory.create_batch(
            130,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            70,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        # likelihood_stop_query without year (averages across years)
        url = reverse_querystring("nc:likelihood-of-stops", args=[agency.id])
        chart_df = likelihood_stop_query(request=rf.get(url), agency_id=agency.id)

        # likelihood_comparison without year (averages across years)
        comp_df = likelihood_comparison(level="agency")
        agency_rows = comp_df[comp_df["group_id"] == str(agency.id)]

        for race in ["Black", "White"]:
            chart_row = chart_df[chart_df["race"] == race].iloc[0]
            comp_row = agency_rows[agency_rows["driver_race"] == race].iloc[0]

            assert chart_row["stop_rate"] == pytest.approx(comp_row["stop_rate"]), (
                f"stop_rate mismatch for {race}"
            )
            assert chart_row["baseline_rate"] == pytest.approx(comp_row["baseline_rate"]), (
                f"baseline_rate mismatch for {race}"
            )

        # Average Black: (110+130)/2 = 120 stops / 5000 pop = 0.024
        # Average White: (50+70)/2   =  60 stops / 5000 pop = 0.012 -> 2.0x
        black_chart = chart_df[chart_df["race"] == "Black"].iloc[0]
        black_comp = agency_rows[agency_rows["driver_race"] == "Black"].iloc[0]
        assert black_chart["stop_rate"] == pytest.approx(0.024)
        assert black_chart["stop_rate_ratio"] == pytest.approx(black_comp["times_likely"])
        assert black_chart["stop_rate_ratio"] == pytest.approx(2.0)


# State ACS ID for North Carolina statewide census data
STATE_ACS_ID = "0400000US37"


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestStatewideLevel:
    """Statewide aggregates all stops in NC against the state ACS census population."""

    def test_statewide_returns_data(self, year_2023):
        """Statewide level returns rows grouped by race with correct stop rates."""
        agency = AgencyFactory(name="Any Agency", census_profile_id="1600000US3719000")
        # Black: 100 stops / 2,000,000 pop = 0.00005
        # White:  50 stops / 6,000,000 pop = 0.00000833...
        # times_likely for Black = 0.00005 / 0.00000833 = 6.0
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID,
            race="Black",
            population=2_000_000,
            population_total=10_000_000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID,
            race="White",
            population=6_000_000,
            population_total=10_000_000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            100,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            50,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df = likelihood_comparison(level="statewide", year=2023)
        assert not df.empty
        assert set(df["level"]) == {"statewide"}
        assert df["group_name"].iloc[0] == "North Carolina"

        black = df[df["driver_race"] == "Black"].iloc[0]
        white = df[df["driver_race"] == "White"].iloc[0]

        assert black["stops"] == 100
        assert white["stops"] == 50
        assert black["times_likely"] == pytest.approx(6.0, rel=0.01)
        assert white["times_likely"] == pytest.approx(1.0)

    def test_statewide_includes_all_agencies(self, year_2023):
        """Statewide aggregates stops from all agencies, unlike agency level."""
        agency_a = AgencyFactory(census_profile_id="1600000US3719000")
        agency_b = AgencyFactory(census_profile_id="1600000US3719001")
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID,
            race="Black",
            population=2_000_000,
            population_total=10_000_000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID,
            race="White",
            population=6_000_000,
            population_total=10_000_000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency_a,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            60,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency_b,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency_a,
            stop__date=year_2023,
        )
        StopSummary.refresh()

        df = likelihood_comparison(level="statewide", year=2023)
        black = df[df["driver_race"] == "Black"].iloc[0]
        assert black["stops"] == 100  # 40 + 60 from both agencies
