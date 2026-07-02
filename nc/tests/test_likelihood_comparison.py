import datetime as dt

import pandas as pd
import pytest

from nc.models import (
    AgencyLikelihoodStatus,
    DriverEthnicity,
    DriverRace,
    LikelihoodOfStopSummary,
    StopSummary,
)
from nc.tests.factories import AgencyFactory, NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import (
    available_likelihood_years,
    excluded_police_agencies,
    likelihood_comparison,
    likelihood_stop_query,
    no_census_agencies,
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
            "total_stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
            "times_likely",
            "status",
            "latitude",
            "longitude",
            "agency_name_race",
        }
        assert set(df.columns) == expected

    def test_active_status_above_threshold(self, durham_agency, year_2023):
        """Agencies with population_total > 10000 get status='active'."""
        _create_stops_and_census(durham_agency, year_2023)  # population_total=20000
        df = likelihood_comparison(level="agency", year=2023)
        assert not df.empty
        assert (df["status"] == AgencyLikelihoodStatus.ACTIVE).all()

    def test_small_population_status_below_threshold(self, year_2023):
        """Agencies with population_total <= 10000 get status='small_population'."""
        small_agency = AgencyFactory(
            name="Tiny Town PD",
            census_profile_id="1600000US0000001",
        )
        NCCensusProfileFactory(
            acs_id=small_agency.census_profile_id,
            race="Black",
            population=500,
            population_total=5000,  # below 10k threshold
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=small_agency.census_profile_id,
            race="White",
            population=2000,
            population_total=5000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            10,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=small_agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=small_agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        # Default (status='active') should exclude this agency
        df_active = likelihood_comparison(level="agency", year=2023)
        assert df_active.empty or str(small_agency.id) not in df_active["group_id"].values

        # status=None should include it with small_population status
        df_all = likelihood_comparison(level="agency", year=2023, status=None)
        small_rows = df_all[df_all["group_id"] == str(small_agency.id)]
        assert not small_rows.empty
        assert (small_rows["status"] == AgencyLikelihoodStatus.SMALL_POPULATION).all()


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

        # chart stop_rate_ratio (percentage diff) == comparison stop_rate_ratio
        # Frontend converts: display_multiplier = 1 + stop_rate_ratio
        black_chart = chart_df[chart_df["race"] == "Black"].iloc[0]
        black_comp = agency_rows[agency_rows["driver_race"] == "Black"].iloc[0]
        assert black_chart["stop_rate_ratio"] == pytest.approx(black_comp["stop_rate_ratio"])
        # (110/5000 - 50/5000) / (50/5000) = (0.022 - 0.010) / 0.010 = 1.2
        assert black_chart["stop_rate_ratio"] == pytest.approx(
            (110 / 5000 - 50 / 5000) / (50 / 5000)
        )

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
        assert black_chart["stop_rate_ratio"] == pytest.approx(black_comp["stop_rate_ratio"])
        # (0.024 - 0.012) / 0.012 = 1.0
        assert black_chart["stop_rate_ratio"] == pytest.approx(1.0)


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


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestLatLon:
    """latitude and longitude should flow through likelihood_comparison results."""

    def test_lat_lon_columns_present(self, durham_agency, year_2023):
        """likelihood_comparison always returns latitude and longitude columns."""
        _create_stops_and_census(durham_agency, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        assert "latitude" in df.columns
        assert "longitude" in df.columns

    def test_lat_lon_values_from_census_profile(self, year_2023):
        """When NCCensusProfile has lat/lon, they appear in the comparison output."""
        agency = AgencyFactory(
            name="Chapel Hill PD",
            census_profile_id="1600000US3712000",
        )
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="Black",
            population=5000,
            population_total=20000,
            year=year_2023.year,
            latitude=35.9132,
            longitude=-79.0558,
        )
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="White",
            population=10000,
            population_total=20000,
            year=year_2023.year,
            latitude=35.9132,
            longitude=-79.0558,
        )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="agency", year=2023)
        row = df[df["group_id"] == str(agency.id)].iloc[0]
        assert row["latitude"] == pytest.approx(35.9132)
        assert row["longitude"] == pytest.approx(-79.0558)

    def test_lat_lon_null_when_not_set(self, durham_agency, year_2023):
        """When NCCensusProfile has no lat/lon, columns contain NaN."""
        _create_stops_and_census(durham_agency, year_2023)
        df = likelihood_comparison(level="agency", year=2023)
        row = df[df["group_id"] == str(durham_agency.id)].iloc[0]
        import math

        assert row["latitude"] is None or math.isnan(row["latitude"])

    def test_lat_lon_uses_most_recent_year(self, year_2023):
        """When multiple ACS years exist, the most recent lat/lon is used."""
        agency = AgencyFactory(
            name="Raleigh PD",
            census_profile_id="1600000US3755000",
        )
        year_2022 = dt.date(2022, 6, 1)
        for yr, lat, lon in [
            (year_2022.year, 35.7000, -78.6000),
            (year_2023.year, 35.7796, -78.6382),
        ]:
            NCCensusProfileFactory(
                acs_id=agency.census_profile_id,
                race="Black",
                population=5000,
                population_total=20000,
                year=yr,
                latitude=lat,
                longitude=lon,
            )
            NCCensusProfileFactory(
                acs_id=agency.census_profile_id,
                race="White",
                population=10000,
                population_total=20000,
                year=yr,
                latitude=lat,
                longitude=lon,
            )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=agency,
            stop__date=year_2023,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="agency", year=2023)
        row = df[df["group_id"] == str(agency.id)].iloc[0]
        # Most recent year (2023) coordinates should be used
        assert row["latitude"] == pytest.approx(35.7796)
        assert row["longitude"] == pytest.approx(-78.6382)


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestTotalStops:
    """total_stops is the sum of all-race stops for a given agency and year."""

    def test_total_stops_single_year(self, durham_agency, year_2023):
        """total_stops equals Black + White stops for that year."""
        _create_stops_and_census(durham_agency, year_2023)  # 50 Black + 30 White
        df = likelihood_comparison(level="agency", year=2023)
        rows = df[df["group_id"] == str(durham_agency.id)]
        # Every race row should report the same agency total: 80
        assert (rows["total_stops"] == 80).all()

    def test_total_stops_all_years_is_average(self, durham_agency, year_2023):
        """Without a year filter, total_stops is the per-year average across years."""
        _create_stops_and_census(durham_agency, year_2023)  # 50 Black + 30 White in 2023
        year_2022 = dt.date(2022, 6, 1)
        NCCensusProfileFactory(
            acs_id=durham_agency.census_profile_id,
            race="Black",
            population=5000,
            population_total=20000,
            year=year_2022.year,
        )
        NCCensusProfileFactory(
            acs_id=durham_agency.census_profile_id,
            race="White",
            population=10000,
            population_total=20000,
            year=year_2022.year,
        )
        PersonFactory.create_batch(
            40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham_agency,
            stop__date=year_2022,
        )
        PersonFactory.create_batch(
            20,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham_agency,
            stop__date=year_2022,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        df = likelihood_comparison(level="agency")
        rows = df[df["group_id"] == str(durham_agency.id)]
        # 2022 total: 60, 2023 total: 80 → average: 70
        assert (rows["total_stops"] == 70).all()


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestSmallRacePopulationStatus:
    """
    Agencies whose census area is large enough (total_population > 10k) but whose
    race-specific population is tiny (≤ 100 for non-White) should receive
    status='small_race_population'.
    """

    def test_small_race_population_status(self, year_2023):
        agency = AgencyFactory(
            name="Mid-Size Town PD",
            census_profile_id="1600000US0000002",
        )
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="Black",
            population=50,  # ≤ 100 → small_race_population
            population_total=15000,  # > 10k → passes total threshold
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=agency.census_profile_id,
            race="White",
            population=8000,
            population_total=15000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            5,
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
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        # Default active filter excludes this agency's Black row
        df_active = likelihood_comparison(level="agency", year=2023)
        black_active = df_active[
            (df_active["group_id"] == str(agency.id)) & (df_active["driver_race"] == "Black")
        ]
        assert black_active.empty

        # White row still passes (White is always included regardless of race pop)
        white_active = df_active[
            (df_active["group_id"] == str(agency.id)) & (df_active["driver_race"] == "White")
        ]
        assert not white_active.empty
        assert white_active.iloc[0]["status"] == AgencyLikelihoodStatus.ACTIVE

        # status=None exposes the Black row with small_race_population
        df_all = likelihood_comparison(level="agency", year=2023, status=None)
        black_row = df_all[
            (df_all["group_id"] == str(agency.id)) & (df_all["driver_race"] == "Black")
        ]
        assert not black_row.empty
        assert black_row.iloc[0]["status"] == AgencyLikelihoodStatus.SMALL_RACE_POPULATION


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestExcludedPoliceAgencies:
    """excluded_police_agencies() returns threshold-excluded non-sheriff agencies."""

    def test_returns_excluded_agencies(self, year_2023):
        active_agency = AgencyFactory(
            name="Big City PD",
            census_profile_id="1600000US0000010",
        )
        small_agency = AgencyFactory(
            name="Tiny Town PD",
            census_profile_id="1600000US0000011",
        )
        for acs_id, total_pop in [
            (active_agency.census_profile_id, 20000),
            (small_agency.census_profile_id, 5000),
        ]:
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="Black",
                population=500,
                population_total=total_pop,
                year=year_2023.year,
            )
            NCCensusProfileFactory(
                acs_id=acs_id,
                race="White",
                population=2000,
                population_total=total_pop,
                year=year_2023.year,
            )
        for agency in [active_agency, small_agency]:
            PersonFactory.create_batch(
                10,
                race=DriverRace.BLACK,
                ethnicity=DriverEthnicity.NON_HISPANIC,
                stop__agency=agency,
                stop__date=year_2023,
            )
            PersonFactory.create_batch(
                20,
                race=DriverRace.WHITE,
                ethnicity=DriverEthnicity.NON_HISPANIC,
                stop__agency=agency,
                stop__date=year_2023,
            )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        result = excluded_police_agencies(year=year_2023.year, race="Black")
        group_ids = result["group_id"].astype(str).tolist()
        assert str(small_agency.id) in group_ids
        assert str(active_agency.id) not in group_ids

    def test_excludes_sheriff_agencies(self, year_2023):
        sheriff = AgencyFactory(
            name="Wake County Sheriff",
            census_profile_id="1600000US0000020",
        )
        NCCensusProfileFactory(
            acs_id=sheriff.census_profile_id,
            race="Black",
            population=100,
            population_total=3000,
            year=year_2023.year,
        )
        NCCensusProfileFactory(
            acs_id=sheriff.census_profile_id,
            race="White",
            population=500,
            population_total=3000,
            year=year_2023.year,
        )
        PersonFactory.create_batch(
            5,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=sheriff,
            stop__date=year_2023,
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()

        result = excluded_police_agencies(year=year_2023.year)
        assert str(sheriff.id) not in result["group_id"].astype(str).tolist()


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestNoCensusAgencies:
    """no_census_agencies() returns non-sheriff agencies with no census profile."""

    def test_returns_agencies_without_census_profile(self):
        agency = AgencyFactory(name="Uncovered PD", census_profile_id="")
        AgencyFactory(name="Covered PD", census_profile_id="1600000US3719000")

        result = no_census_agencies()
        ids = result["group_id"].astype(str).tolist()
        assert str(agency.id) in ids

    def test_excludes_agencies_with_census_profile(self):
        AgencyFactory(name="Covered PD", census_profile_id="1600000US3719000")
        result = no_census_agencies()
        assert result.empty

    def test_excludes_sheriff_agencies(self):
        AgencyFactory(name="Wake County Sheriff", census_profile_id="")
        result = no_census_agencies()
        assert result.empty
