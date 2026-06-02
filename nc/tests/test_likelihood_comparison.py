import datetime as dt

import pandas as pd
import pytest

from nc.models import DriverEthnicity, DriverRace, LikelihoodOfStopSummary, StopSummary
from nc.tests.factories import AgencyFactory, NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import (
    available_likelihood_years,
    likelihood_comparison,
    likelihood_stop_query,
    parity_data,
)


@pytest.fixture
def year_2023():
    return dt.date(2023, 6, 1)


@pytest.fixture
def durham_agency():
    return AgencyFactory(
        name="Durham Police Department",
        census_profile_id="1600000US3719000",
    )


def _create_stops_and_census(agency, year_date):
    """Helper to create stops and census data for agency-level tests."""
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
    LikelihoodOfStopSummary.refresh()


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestLikelihoodComparison:
    def test_agency_level_returns_data(self, durham_agency, year_2023):
        _create_stops_and_census(durham_agency, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        assert not df.empty
        assert "agency_name_race" in df.columns
        assert set(df["level"]) == {"agency"}
        # Should have rows for both Black and White
        races = set(df["driver_race"])
        assert "Black" in races
        assert "White" in races

    def test_empty_result(self):
        """No data returns empty DataFrame."""
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        df = likelihood_comparison(level="agency", year=2099)
        assert df.empty

    def test_no_census_year_unavailable(self, durham_agency, year_2023):
        """Years without census-backed likelihood data should be gated out."""
        _create_stops_and_census(durham_agency, year_2023)

        # Add stop records for a newer year without adding census rows.
        year_2024 = dt.date(2024, 6, 1)
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham_agency,
            stop__date=year_2024,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        years = available_likelihood_years()
        assert 2023 in years
        assert 2024 not in years
        assert likelihood_comparison(level="agency", year=2024).empty

    def test_census_year_available_without_stops(self, durham_agency, year_2023):
        """Census-backed years remain selectable even when stop rows do not exist."""
        _create_stops_and_census(durham_agency, year_2023)
        NCCensusProfileFactory(
            acs_id=durham_agency.census_profile_id,
            race="Black",
            population=5100,
            population_total=21000,
            year=2022,
        )
        NCCensusProfileFactory(
            acs_id=durham_agency.census_profile_id,
            race="White",
            population=10100,
            population_total=21000,
            year=2022,
        )

        years = available_likelihood_years()
        assert 2023 in years
        assert 2022 in years

    def test_times_likely_white_is_one(self, durham_agency, year_2023):
        """White drivers should have times_likely == 1.0 (baseline)."""
        _create_stops_and_census(durham_agency, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        white = df[df["driver_race"] == "White"]
        for _, row in white.iterrows():
            assert row["times_likely"] == pytest.approx(1.0)

    def test_expected_columns(self, durham_agency, year_2023):
        _create_stops_and_census(durham_agency, year_2023)
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
        agency = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
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
        LikelihoodOfStopSummary.refresh()

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
        agency = AgencyFactory(
            name="Durham Police Department",
            census_profile_id="1600000US3719000",
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
        LikelihoodOfStopSummary.refresh()

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
        LikelihoodOfStopSummary.refresh()

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
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="statewide", year=2023)
        black = df[df["driver_race"] == "Black"].iloc[0]
        assert black["stops"] == 100  # 40 + 60 from both agencies


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestACSPopulationByYear:
    """
    ACS population values should be year-specific when a year is requested,
    and averaged across available ACS years when no year is specified.
    """

    def test_year_specific_population(self, year_2023):
        """Year-filtered query uses ACS population for that year, not the average."""
        agency = AgencyFactory()
        year_2022 = dt.date(2022, 6, 1)
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="Black", population=4000, population_total=11000, year=2022
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="White", population=5000, population_total=11000, year=2022
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="Black", population=6000, population_total=12000, year=2023
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="White", population=5000, population_total=12000, year=2023
        )
        PersonFactory.create_batch(
            60,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="statewide", year=2023)
        black = df[df["driver_race"] == "Black"].iloc[0]
        assert black["population"] == 6000  # 2023 ACS, not avg (5000)
        assert black["total_population"] == 12000

    def test_all_years_population_is_average(self, year_2023):
        """No-year query averages ACS population across available years."""
        agency = AgencyFactory()
        year_2022 = dt.date(2022, 6, 1)
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="Black", population=4000, population_total=11000, year=2022
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="White", population=5000, population_total=11000, year=2022
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="Black", population=6000, population_total=12000, year=2023
        )
        NCCensusProfileFactory(
            acs_id=STATE_ACS_ID, race="White", population=5000, population_total=12000, year=2023
        )
        PersonFactory.create_batch(
            60,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2022,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="statewide")
        black = df[df["driver_race"] == "Black"].iloc[0]
        assert black["population"] == 5000  # (4000 + 6000) / 2
        assert black["total_population"] == 11500  # (11000 + 12000) / 2


class TestParityData:
    def test_expected_columns(self):
        df = pd.DataFrame(
            {
                "group_id": ["1", "1"],
                "group_name": ["Durham PD", "Durham PD"],
                "driver_race": ["Black", "White"],
                "population": [5000, 10000],
                "total_population": [20000, 20000],
                "stops": [50, 30],
                "stop_rate_ratio": [1.5, 1.0],
            }
        )
        result = parity_data(df)
        assert {"pop_share", "stop_share", "excess_stops", "agency_name"}.issubset(result.columns)

    def test_pop_share_and_stop_share_values(self):
        df = pd.DataFrame(
            {
                "group_id": ["1", "1"],
                "group_name": ["Durham PD", "Durham PD"],
                "driver_race": ["Black", "White"],
                "population": [5000, 10000],
                "total_population": [20000, 20000],
                "stops": [50, 30],
                "stop_rate_ratio": [1.5, 1.0],
            }
        )
        result = parity_data(df)
        black = result[result["driver_race"] == "Black"].iloc[0]
        assert black["pop_share"] == pytest.approx(5000 / 20000)
        assert black["stop_share"] == pytest.approx(50 / 80)  # 80 total stops
        assert black["excess_stops"] == pytest.approx(50 - (5000 / 20000) * 80)

    def test_empty_dataframe_returns_empty(self):
        df = pd.DataFrame(
            columns=[
                "group_id",
                "group_name",
                "driver_race",
                "population",
                "total_population",
                "stops",
            ]
        )
        result = parity_data(df)
        assert result.empty

    def test_white_always_present_when_filtering_by_race(self):
        """Filtering parity_data output to a selected race + White always includes White."""
        df = pd.DataFrame(
            {
                "group_id": ["1", "1", "1"],
                "group_name": ["Durham PD"] * 3,
                "driver_race": ["Black", "Hispanic", "White"],
                "population": [5000, 3000, 10000],
                "total_population": [20000, 20000, 20000],
                "stops": [50, 20, 30],
                "stop_rate_ratio": [1.5, 1.2, 1.0],
            }
        )
        result = parity_data(df)
        # Simulate notebook filter: selected race + White baseline
        selected_race = "Black"
        filtered = result[result["driver_race"].isin({selected_race, "White"})]
        assert set(filtered["driver_race"]) == {"Black", "White"}
        assert "Hispanic" not in filtered["driver_race"].values

    def test_stop_share_requires_all_races_in_input(self):
        """
        parity_data must receive all races for a group so stop_share denominators
        are correct. With only one race, stop_share is always 1.0 (a known footgun
        if the caller pre-filters by race before passing to parity_data).
        """
        all_races = pd.DataFrame(
            {
                "group_id": ["1", "1"],
                "group_name": ["Durham PD", "Durham PD"],
                "driver_race": ["Black", "White"],
                "population": [5000, 10000],
                "total_population": [20000, 20000],
                "stops": [50, 30],
                "stop_rate_ratio": [1.5, 1.0],
            }
        )
        # Correct: all races provided — Black stop_share = 50/80
        result_all = parity_data(all_races)
        black_all = result_all[result_all["driver_race"] == "Black"].iloc[0]
        assert black_all["stop_share"] == pytest.approx(50 / 80)

        # Incorrect caller pattern: pre-filtered to one race → stop_share = 1.0
        single_race = all_races[all_races["driver_race"] == "Black"].copy()
        result_single = parity_data(single_race)
        black_single = result_single[result_single["driver_race"] == "Black"].iloc[0]
        assert black_single["stop_share"] == pytest.approx(1.0)
