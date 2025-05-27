import datetime as dt

import pandas as pd
import pytest

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, StopSummary
from nc.tests.factories import NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import StopSummaryFilterSet, get_acs_population_data, get_stop_count_data


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
class TestLikelihoodStopView:
    def test_agency_stop_counts_by_year(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=100,
            population_total=200,
            population_percent=0.5,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=100,
            population_total=200,
            population_percent=0.5,
            year=year_2020.year,
        )
        PersonFactory.create_batch(
            size=21,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=13,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
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
        stop_rate_ratio = round((stop_rate - baseline_rate) / baseline_rate * 100, 2)
        # (21 - 13) / 13 = 8 / 13 * 100 = 61.54
        assert pytest.approx(stop_rate_ratio) == 61.54
        assert black_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)
