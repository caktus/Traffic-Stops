import datetime as dt

import pytest

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, LikelihoodOfStopSummary, StopSummary
from nc.tests.factories import NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import likelihood_stop_query


@pytest.fixture
def year_2020():
    return dt.date(2020, 1, 1)


@pytest.fixture
def year_2021():
    return dt.date(2021, 1, 1)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestLikelihoodStopQuery:
    def test_less_likelihood_of_stops(self, rf, durham, year_2020):
        """Test likelihood of stop query."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="Asian",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
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
        LikelihoodOfStopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        df = likelihood_stop_query(request=rf.get(url), agency_id=durham.id)
        asian_drivers = df[df["race"] == "Asian"]
        black_drivers = df[df["race"] == "Black"]
        white_drivers = df[df["race"] == "White"]
        # 17 / 1000 = 1.7% stop rate for asian drivers
        asian_stop_rate = asian_drivers.iloc[0]["stop_rate"]
        assert asian_stop_rate == pytest.approx(0.017)
        # 70 / 1000 = 7.0% stop rate for black drivers
        black_stop_rate = black_drivers.iloc[0]["stop_rate"]
        assert black_stop_rate == pytest.approx(0.07)
        # 26 / 1000 = 2.6% baseline stop rate for white drivers
        white_stop_rate = white_drivers.iloc[0]["stop_rate"]
        assert asian_drivers.iloc[0]["baseline_rate"] == pytest.approx(white_stop_rate)
        assert black_drivers.iloc[0]["baseline_rate"] == pytest.approx(white_stop_rate)
        stop_rate_ratio = asian_drivers.iloc[0]["stop_rate_ratio"]
        # Asian driver stop rate ratio: (1.7 - 2.6) / 2.6 = -0.3462
        expected_ratio = (asian_stop_rate - white_stop_rate) / white_stop_rate
        assert stop_rate_ratio == pytest.approx(expected_ratio, abs=0.01)
        assert stop_rate_ratio == pytest.approx(-0.3462, abs=0.001)
        # Black driver stop rate ratio: (7.0 - 2.6) / 2.6 = 1.6923
        black_stop_rate_ratio = black_drivers.iloc[0]["stop_rate_ratio"]
        expected_black_ratio = (black_stop_rate - white_stop_rate) / white_stop_rate
        assert black_stop_rate_ratio == pytest.approx(expected_black_ratio, abs=0.01)
        assert black_stop_rate_ratio == pytest.approx(1.6923, abs=0.001)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestLikelihoodStopView:
    def test_agency_stop_counts_by_year(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        PersonFactory.create_batch(
            size=21, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=13, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # Black: 21/1000 = 2.1%, White: 13/1000 = 1.3%; ratio=(2.1-1.3)/1.3 = 0.62
        assert data["stop_percentages"] == [0.62]
        assert data["stop_percentages_races"] == ["Black"]
        table_data = data["table_data"]
        assert len(table_data) == 2
        black_drivers = table_data[1]
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
        assert stop_rate == pytest.approx(2.1)  # 2.1% stop rate for black drivers
        assert baseline_rate == pytest.approx(1.3)  # 1.3% baseline stop rate for white drivers
        # stop_rate_ratio is percentage difference: (2.1 - 1.3) / 1.3 ≈ 0.62
        assert black_drivers["stop_rate_ratio"] == pytest.approx(0.62, abs=0.01)

    def test_more_and_less_likelihood_of_stops(self, client, durham, year_2020):
        """Test likelihood of stop API view."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="Asian",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
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
        LikelihoodOfStopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["stop_percentages"] == [1.69, -0.35]
        assert data["stop_percentages_races"] == ["Black", "Asian"]
        table_data = data["table_data"]
        assert len(table_data) == 3
        black_drivers = table_data[1]
        asian_drivers = table_data[2]
        assert list(asian_drivers.keys()) == [
            "race",
            "population",
            "stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
        ]
        # Asian: 17/1000=1.7%, White: 26/1000=2.6%; ratio=(1.7-2.6)/2.6=-0.35
        assert asian_drivers["stop_rate"] == pytest.approx(1.7)
        assert asian_drivers["baseline_rate"] == pytest.approx(2.6)
        assert asian_drivers["stop_rate_ratio"] == pytest.approx(-0.35, abs=0.01)
        # Black: 70/1000=7.0%, White: 26/1000=2.6%; ratio=(7.0-2.6)/2.6=1.69
        assert black_drivers["stop_rate"] == pytest.approx(7.0)
        assert black_drivers["baseline_rate"] == pytest.approx(2.6)
        assert black_drivers["stop_rate_ratio"] == pytest.approx(1.69, abs=0.01)

    def test_no_acs_data_empty_stop_percentages(self, client, durham, year_2020):
        """Test likelihood of stop API view when no ACS data exists."""
        PersonFactory.create_batch(
            size=21, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=13, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["stop_percentages"] == []
        assert data["table_data"] == []
        assert "stop_percentages_races" not in data

    def test_stop_rate_ratio_is_percentage_difference(self, rf, durham, year_2020):
        """Test that stop_rate_ratio is percentage difference: (rate - baseline) / baseline."""
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=1000,
            population_total=20000,
            year=year_2020.year,
        )
        PersonFactory.create_batch(
            size=30, race=DriverRace.BLACK, stop__agency=durham, stop__date=year_2020
        )
        PersonFactory.create_batch(
            size=10, race=DriverRace.WHITE, stop__agency=durham, stop__date=year_2020
        )
        StopSummary.refresh()
        LikelihoodOfStopSummary.refresh()
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": year_2020.year}
        )
        df = likelihood_stop_query(request=rf.get(url), agency_id=durham.id)
        black_drivers = df[df["race"] == "Black"].iloc[0]
        # Black: 30/1000=3%, White: 10/1000=1%; (3-1)/1 = 2.0
        assert black_drivers["stop_rate_ratio"] == pytest.approx(2.0, abs=0.01)
