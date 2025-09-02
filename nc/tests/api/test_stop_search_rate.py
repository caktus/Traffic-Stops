import datetime as dt

import pandas as pd
import pytest

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, StopSummary
from nc.tests.factories import NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import (
    StopSummaryFilterSet,
    get_acs_population_data,
    get_stop_count_data,
    likelihood_stop_query,
)


@pytest.fixture
def year_2020():
    return dt.date(2020, 1, 1)


@pytest.fixture
def year_2021():
    return dt.date(2021, 1, 1)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestGetACSPopulationData:
    @pytest.mark.parametrize("year,white_pop,black_pop", [(2020, 50, 50), (2010, 25, 75)])
    def test_acs_data_by_year(self, year: int, white_pop: int, black_pop: int):
        """Test census population data by year."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=white_pop,
            population_total=white_pop + black_pop,
            population_percent=(white_pop / (white_pop + black_pop)),
            year=year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=black_pop,
            population_total=white_pop + black_pop,
            population_percent=(black_pop / (white_pop + black_pop)),
            year=year,
        )
        data = get_acs_population_data(acs_id="durham", year=year)
        assert data.shape == (2, 2)
        assert data["population"].sum() == white_pop + black_pop
        assert data[data["race"] == "White"]["population"].iloc[0] == white_pop
        assert data[data["race"] == "Black"]["population"].iloc[0] == black_pop

    def test_acs_data_avg(self):
        """Test average census population data."""
        # Actual Durham, NC data from 2010, 2015, and 2020
        data = [
            ("Black", 2010, 88013, 220324, 0.3994),
            ("Black", 2015, 97874, 246084, 0.3977),
            ("Black", 2020, 102385, 276341, 0.3705),
            ("White", 2010, 86126, 220324, 0.3909),
            ("White", 2015, 94160, 246084, 0.3826),
            ("White", 2020, 110435, 276341, 0.3996),
        ]
        for race, year, population, population_total, population_percent in data:
            NCCensusProfileFactory(
                acs_id="durham",
                race=race,
                population=population,
                population_total=population_total,
                population_percent=population_percent,
                year=year,
            )
        data = get_acs_population_data(acs_id="durham")
        assert data.shape == (2, 2)
        expected_df = pd.DataFrame(
            data, columns=["race", "year", "population", "population_total", "population_percent"]
        )
        expected_white_pop = expected_df[expected_df["race"] == "White"]["population"].mean()
        expected_black_pop = expected_df[expected_df["race"] == "Black"]["population"].mean()
        assert data["population"].sum() == expected_white_pop + expected_black_pop
        assert data[data["race"] == "White"]["population"].iloc[0] == expected_white_pop
        assert data[data["race"] == "Black"]["population"].iloc[0] == expected_black_pop

    def test_acs_data_no_data_found(self):
        """Test census population data when no data exists for the given acs_id."""
        # Don't create any NCCensusProfile records
        data = get_acs_population_data(acs_id="nonexistent")
        # Should return empty DataFrame with expected columns
        assert data.shape == (0, 2)
        assert list(data.columns) == ["race", "population"]
        assert data.empty

    def test_acs_data_no_data_found_with_year(self):
        """Test census population data when no data exists for the given acs_id and year."""
        # Create data for a different year
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=100,
            year=2020,
        )
        # Query for a year that doesn't exist
        data = get_acs_population_data(acs_id="durham", year=2015)
        # Should return empty DataFrame with expected columns
        assert data.shape == (0, 2)
        assert list(data.columns) == ["race", "population"]
        assert data.empty


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestGetStopCountData:
    def test_agency_stop_counts_by_year(self, durham, year_2020):
        """Test stop count data for a single agency for a specific year."""
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        StopSummary.refresh()
        filter_set = StopSummaryFilterSet(data={"year": year_2020.year}, agency_id=durham.id)
        filter_set.is_valid()
        df = get_stop_count_data(filter_set=filter_set)
        assert df.shape == (2, 3)  # Two rows for black and white drivers
        assert df["stops"].sum() == 30
        # black and white drivers
        assert df[df["driver_race_comb"] == "Black"]["stops"].iloc[0] == 20
        assert df[df["driver_race_comb"] == "White"]["stops"].iloc[0] == 10

    def test_statewide_stop_counts_by_year(self, durham, raleigh, year_2020):
        """Test statewide stop count data for a specific year."""
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        StopSummary.refresh()
        filter_set = StopSummaryFilterSet(data={"year": year_2020.year}, agency_id=STATEWIDE)
        filter_set.is_valid()
        df = get_stop_count_data(filter_set=filter_set)
        assert df.shape == (2, 3)  # Two rows for black and white drivers
        assert df["stops"].sum() == 60
        # black and white drivers
        assert df[df["driver_race_comb"] == "Black"]["stops"].iloc[0] == 40
        assert df[df["driver_race_comb"] == "White"]["stops"].iloc[0] == 20

    @pytest.mark.parametrize("agency_id", [STATEWIDE, 80])
    def test_statewide_stop_counts_by_year_no_data(self, year_2020, agency_id):
        """
        Test stop count data for statewide or agency ID with no stops still
        returns empty DataFrame.
        """
        StopSummary.refresh()
        filter_set = StopSummaryFilterSet(data={"year": year_2020.year}, agency_id=agency_id)
        filter_set.is_valid()
        df = get_stop_count_data(filter_set=filter_set)
        assert df.shape == (0, 3)

    def test_agency_stop_counts_average(self, durham, year_2020, year_2021):
        """Test stop count data for a single agency across multiple years."""
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2021,
        )
        PersonFactory.create_batch(
            size=30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2021,
        )
        StopSummary.refresh()
        filter_set = StopSummaryFilterSet(data={}, agency_id=durham.id)
        filter_set.is_valid()
        df = get_stop_count_data(filter_set=filter_set)
        assert df.shape == (2, 3)  # Two rows for black and white drivers
        assert df["stops"].sum() == 50
        # black and white drivers
        assert df[df["driver_race_comb"] == "Black"]["stops"].iloc[0] == 30
        assert df[df["driver_race_comb"] == "White"]["stops"].iloc[0] == 20

    def test_statewide_stop_counts_average(self, durham, raleigh, year_2020, year_2021):
        """Test statewide stop count data across multiple years."""
        PersonFactory.create_batch(
            size=30,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=60,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2021,
        )
        PersonFactory.create_batch(
            size=30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2021,
        )
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=40,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2021,
        )
        PersonFactory.create_batch(
            size=30,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2021,
        )
        StopSummary.refresh()
        filter_set = StopSummaryFilterSet(data={}, agency_id=STATEWIDE)
        filter_set.is_valid()
        df = get_stop_count_data(filter_set=filter_set)
        assert df.shape == (2, 3)  # Two rows for black and white drivers
        # 2020: 30 + 10 + 20 + 10 = 70
        # 2021: 60 + 30 + 40 + 30 = 160
        # Average: (70 + 160) / 2 = 115
        assert df["stops"].sum() == 115
        # 2020: 30 + 20 = 50
        # 2021: 60 + 40 = 100
        # Average: (50 + 100) / 2 = 75
        assert df[df["driver_race_comb"] == "Black"]["stops"].iloc[0] == 75
        # 2020: 10 + 10 = 20
        # 2021: 30 + 30 = 60
        # Average: (20 + 60) / 2 = 40
        assert df[df["driver_race_comb"] == "White"]["stops"].iloc[0] == 40


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestLikelihoodStopQuery:
    def test_less_likelihood_of_stops(self, rf, durham, year_2020):
        """Test likelihood of stop query."""
        NCCensusProfileFactory(acs_id="durham", race="Asian", population=1000, year=year_2020.year)
        NCCensusProfileFactory(acs_id="durham", race="Black", population=1000, year=year_2020.year)
        NCCensusProfileFactory(acs_id="durham", race="White", population=1000, year=year_2020.year)
        PersonFactory.create_batch(
            size=17, race=DriverRace.ASIAN, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=70, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=26, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        df = likelihood_stop_query(request=rf.get(url), agency_id=durham.id)
        asian_drivers = df[df["race"] == "Asian"]
        black_drivers = df[df["race"] == "Black"]
        white_drivers = df[df["race"] == "White"]
        # 17 / 1000 = 1.7% stop rate for asian drivers
        asian_stop_rate = asian_drivers.iloc[0]["stop_rate"]
        assert asian_stop_rate == 0.017
        # 70 / 1000 = 7.0% stop rate for black drivers
        black_stop_rate = black_drivers.iloc[0]["stop_rate"]
        assert black_stop_rate == 0.07
        # 26 / 1000 = 2.6% baseline stop rate for white drivers
        white_stop_rate = white_drivers.iloc[0]["stop_rate"]
        assert asian_drivers.iloc[0]["baseline_rate"] == white_stop_rate
        assert black_drivers.iloc[0]["baseline_rate"] == white_stop_rate
        stop_rate_ratio = asian_drivers.iloc[0]["stop_rate_ratio"]
        # Asian driver stop rate ratio: 17 / 26 = 0.6538
        assert stop_rate_ratio == asian_stop_rate / white_stop_rate
        assert round(stop_rate_ratio, 4) == 0.6538
        # Black driver stop rate ratio: 70 / 26 = 2.6923
        black_stop_rate_ratio = black_drivers.iloc[0]["stop_rate_ratio"]
        assert black_stop_rate_ratio == black_stop_rate / white_stop_rate
        assert round(black_stop_rate_ratio, 4) == 2.6923


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestLikelihoodStopView:
    def test_agency_stop_counts_by_year(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        NCCensusProfileFactory(acs_id="durham", race="Black", population=100, year=year_2020.year)
        NCCensusProfileFactory(acs_id="durham", race="White", population=100, year=year_2020.year)
        PersonFactory.create_batch(
            size=21, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=13, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # Stop rate ratio should be 0.6 for black drivers, or black drivers are
        # 60% more likely to be pulled over than white drivers
        assert data["stop_percentages"] == [0.62]
        table_data = data["table_data"]
        # Two rows for white and black drivers
        assert len(table_data) == 2
        # Stop rate ratio should be 1.5 for black drivers
        black_drivers = table_data[1]
        # Check key order for table data
        assert list(black_drivers.keys()) == [
            "race",
            "population",
            "stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
        ]
        stop_rate = black_drivers["stop_rate"]
        baseline_rate = black_drivers["baseline_rate"]
        assert stop_rate == 21.0  # 21% stop rate for black drivers
        assert baseline_rate == 13.0  # 13% baseline stop rate for white drivers
        stop_rate_ratio = round((stop_rate - baseline_rate) / baseline_rate, 2) + 1
        # (21 - 13) / 13 = 8 / 13 * 100 = 61.54
        assert pytest.approx(stop_rate_ratio) == 1.62
        assert black_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)

    def test_more_and_less_likelihood_of_stops(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        NCCensusProfileFactory(acs_id="durham", race="Asian", population=1000, year=year_2020.year)
        NCCensusProfileFactory(acs_id="durham", race="Black", population=1000, year=year_2020.year)
        NCCensusProfileFactory(acs_id="durham", race="White", population=1000, year=year_2020.year)
        PersonFactory.create_batch(
            size=17, race=DriverRace.ASIAN, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=26, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=70, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["stop_percentages"] == [1.69, -0.35]
        table_data = data["table_data"]
        # Three rows for white, black, and asian drivers
        assert len(table_data) == 3
        black_drivers = table_data[1]
        asian_drivers = table_data[2]
        # Check key order for table data
        assert list(asian_drivers.keys()) == [
            "race",
            "population",
            "stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
        ]
        # Asian drivers
        stop_rate = asian_drivers["stop_rate"]
        baseline_rate = asian_drivers["baseline_rate"]
        assert stop_rate == 1.7  # 1.7% stop rate for asian drivers
        assert baseline_rate == 2.6  # 2.6% baseline stop rate for white drivers
        stop_rate_ratio = round(stop_rate / baseline_rate, 2)
        # 17 / 26 = 0.6538
        assert pytest.approx(stop_rate_ratio) == 0.65
        assert asian_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)
        # Black drivers
        stop_rate = black_drivers["stop_rate"]
        baseline_rate = black_drivers["baseline_rate"]
        assert stop_rate == 7.0  # 7.0% stop rate for black drivers
        assert baseline_rate == 2.6
        # 70 / 26 = 2.6923
        stop_rate_ratio = round(stop_rate / baseline_rate, 2)
        assert pytest.approx(stop_rate_ratio) == 2.69
        assert black_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)

    def test_no_acs_data_empty_stop_percentages(self, client, durham, year_2020):
        """Test likelihood of stop API view when no ACS data exists."""
        # Create stop data but no ACS data
        PersonFactory.create_batch(
            size=21, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=13, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # When no ACS data exists, stop_percentages should be empty
        assert data["stop_percentages"] == []
        assert data["table_data"] == []
