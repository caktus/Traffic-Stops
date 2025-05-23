from decimal import Decimal

import pandas as pd
import pytest
import datetime as dt

from django.urls import reverse
from django.utils import timezone

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, LikelihoodStopSummary, Stop, StopSummary
from nc.tests.factories import NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import likelihood_stop_query, get_acs_data


@pytest.fixture
def year_2020():
    return dt.date(2020, 1, 1)


@pytest.fixture
def year_2021():
    return dt.date(2021, 1, 1)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestACS:
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
        data = get_acs_data(acs_id="durham", year=year)
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
        data = get_acs_data(acs_id="durham")
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
class TestLikelihoodStop:

    @pytest.fixture
    def year_2020(self):
        return dt.date(2020, 1, 1)

    @pytest.fixture
    def year_2021(self):
        return dt.date(2021, 1, 1)

    # @pytest.fixture(autouse=True)
    # def stop_data(self, durham, year_2020, last_year):
    #     # Easy math 50% White, 50% Black population
    #     NCCensusProfileFactory(
    #         acs_id="durham",
    #         race="White",
    #         population=50,
    #         population_total=100,
    #         population_percent=0.5,
    #         year=year_2020.year,
    #     )
    #     NCCensusProfileFactory(
    #         acs_id="durham",
    #         race="Black",
    #         population=50,
    #         population_total=100,
    #         population_percent=0.5,
    #         year=year_2020.year,
    #     )
    #     # 40% black stopped, 20% white stopped this year
    #     PersonFactory.create_batch(
    #         size=20,
    #         race=DriverRace.BLACK,
    #         ethnicity=DriverEthnicity.NON_HISPANIC,
    #         stop__agency=durham,
    #         stop__date=year_2020,
    #     )
    #     PersonFactory.create_batch(
    #         size=10,
    #         race=DriverRace.WHITE,
    #         ethnicity=DriverEthnicity.NON_HISPANIC,
    #         stop__agency=durham,
    #         stop__date=year_2020,
    #     )
    #     # 32% black stopped, 20% white stopped last year
    #     PersonFactory.create_batch(
    #         size=16,
    #         race=DriverRace.BLACK,
    #         ethnicity=DriverEthnicity.NON_HISPANIC,
    #         stop__agency=durham,
    #         stop__date=last_year,
    #     )
    #     PersonFactory.create_batch(
    #         size=10,
    #         race=DriverRace.WHITE,
    #         ethnicity=DriverEthnicity.NON_HISPANIC,
    #         stop__agency=durham,
    #         stop__date=last_year,
    #     )
    #     # Likelihood depends on StopSummary, so refresh it first
    #     StopSummary.refresh()
    #     # LikelihoodStopSummary.refresh()

    # def test_stop_rate(self, year_2020):
    #     """Test materialized view for stop rates this year."""
    #     df = pd.DataFrame(LikelihoodStopSummary.objects.filter(year=year_2020.year).values())
    #     black_drivers = df["driver_race_comb"] == "Black"
    #     white_drivers = df["driver_race_comb"] == "White"
    #     # Test census data
    #     assert df[black_drivers]["population"].sum() == 50
    #     assert df[black_drivers]["population_percent"].sum() == 0.5
    #     assert df[white_drivers]["population"].sum() == 50
    #     assert df[white_drivers]["population_percent"].sum() == 0.5
    #     # Stop rate should be 40% for black drivers (20 stops / 50 population)
    #     assert df[black_drivers]["stops"].sum() == 20
    #     assert df[black_drivers]["stop_rate"].sum() == Decimal("0.4")
    #     # Stop rate should be 20% for white drivers (10 stops / 50 population)
    #     assert df[white_drivers]["stops"].sum() == 10
    #     assert df[white_drivers]["stop_rate"].sum() == Decimal("0.2")
    #     # Total stops should be 30 (20 black drivers, 10 white drivers)
    #     assert df[black_drivers]["stops_total"].sum() == 30
    #     assert df[white_drivers]["stops_total"].sum() == 30
    #     # Baseline rate should be 20% for both (baseline = white drivers)
    #     assert df[black_drivers]["baseline_rate"].sum() == Decimal("0.2")
    #     assert df[white_drivers]["baseline_rate"].sum() == Decimal("0.2")
    #     # Stop rate ratio should be 1.0 for black drivers, or twice as likely to be stopped
    #     assert df[black_drivers]["stop_rate_ratio"].sum() == Decimal("1.0")

    # def test_likelihood_stop_query(self, rf, durham):
    #     """Test likelihood_stop_query function."""
    #     df = likelihood_stop_query(rf.get(""), agency_id=durham.id)
    #     assert df.columns.tolist() == [
    #         "id",
    #         "agency_id",
    #         "driver_race",
    #         "population",
    #         "population_total",
    #         "population_percent",
    #         "stops",
    #         "stops_total",
    #         "stop_rate",
    #         "baseline_rate",
    #         "stop_rate_ratio",
    #     ]
    #     # Statewide works too
    #     df = likelihood_stop_query(rf.get(""), agency_id=STATEWIDE)
    #     assert df.columns.tolist() == [
    #         "id",
    #         "agency_id",
    #         "driver_race",
    #         "population",
    #         "population_total",
    #         "population_percent",
    #         "stops",
    #         "stops_total",
    #         "stop_rate",
    #         "baseline_rate",
    #         "stop_rate_ratio",
    #     ]

    def test_likelihood_stop_view_durham_year_2020(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        # Easy math 50% black, 50% white population
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=50,
            population_total=100,
            population_percent=0.5,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=50,
            population_total=100,
            population_percent=0.5,
            year=year_2020.year,
        )
        # 32% black drivers stopped, 20% white drivers stopped
        PersonFactory.create_batch(
            size=16,
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
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # Stop rate ratio should be 0.6 for black drivers, or black drivers are
        # 60% more likely to be pulled over than white drivers
        assert data["stop_percentages"] == [0.0, 0.6]
        table_data = data["table_data"]
        # Two rows for white and black drivers
        assert len(table_data) == 2
        # Stop rate ratio should be 1.5 for black drivers
        black_drivers = table_data[1]
        stop_rate = black_drivers["stop_rate"]
        baseline_rate = black_drivers["baseline_rate"]
        assert stop_rate == 0.32  # 32% stop rate for black drivers
        assert baseline_rate == 0.2  # 20% baseline stop rate for white drivers
        stop_rate_ratio = (stop_rate - baseline_rate) / baseline_rate
        # 12% / 20% = 0.6, or 60% more likely to be stopped
        assert pytest.approx(stop_rate_ratio) == 0.6
        assert black_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)

    def test_likelihood_stop_view_statewide_year_2020(
        self, client, year_2020, durham, raleigh, nc_state
    ):
        """Test statewide likelihood of stop API view."""
        # Easy math 50% black, 50% white population
        NCCensusProfileFactory(
            acs_id="nc",
            race="Black",
            population=50,
            population_total=100,
            population_percent=0.5,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="nc",
            race="White",
            population=50,
            population_total=100,
            population_percent=0.5,
            year=year_2020.year,
        )
        # Durham stops
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=5,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=year_2020,
        )
        # Raleigh stops
        PersonFactory.create_batch(
            size=15,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        PersonFactory.create_batch(
            size=5,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=raleigh,
            stop__date=year_2020,
        )
        StopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[STATEWIDE], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        table_data = data["table_data"]
        data = response.json()
        # Two rows for white and black drivers
        assert len(table_data) == 2
        black_drivers = table_data[1]
        stop_rate = black_drivers["stop_rate"]
        baseline_rate = black_drivers["baseline_rate"]
        assert stop_rate == 0.5  # 50% stop rate for black drivers statewide
        assert baseline_rate == 0.2  # 20% baseline stop rate for white drivers statewide
        stop_rate_ratio = (stop_rate - baseline_rate) / baseline_rate
        # 30% / 20% = 1.5, or 150%/2.5 times more likely to be stopped
        assert pytest.approx(stop_rate_ratio) == 1.5
        assert black_drivers["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)
        assert data["stop_percentages"] == [0.0, stop_rate_ratio]

    # def test_likelihood_stop_view_year_2020(self, client, durham, year_2020):
    #     """Test likelihood of stop API view with year querysting parameter."""
    #     url = reverse_querystring(
    #         "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
    #     )
    #     response = client.get(url, format="json")
    #     assert response.status_code == 200
    #     data = response.json()
    #     # Stop rate ratio should be 1.0 for black drivers, or twice as likely to be stopped
    #     assert data["stop_percentages"] == [1.0]

    # def test_likelihood_stop_timezone_boundary(self, year_2020):
    #     """Test January 1st boundary for stop likelihood."""
    #     # Use a time safely into Jan 1 to avoid timezone offset issues
    #     jan_1_midday = year_2020.replace(month=1, day=1, hour=12)

    #     Stop.objects.update(date=jan_1_midday)
    #     StopSummary.refresh()
    #     LikelihoodStopSummary.refresh()

    #     years = LikelihoodStopSummary.objects.values("year").distinct()
    #     assert years[0] == {"year": year_2020.year}
