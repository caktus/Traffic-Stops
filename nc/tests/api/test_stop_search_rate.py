from decimal import Decimal

import pandas as pd
import pytest

from django.urls import reverse
from django.utils import timezone

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, LikelihoodStopSummary, StopSummary
from nc.tests.factories import NCCensusProfileFactory, PersonFactory
from nc.tests.urls import reverse_querystring
from nc.views.likelihood import likelihood_stop_query


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestLikelihoodStop:

    @pytest.fixture
    def this_year(self):
        return timezone.now().replace(month=6, day=1)

    @pytest.fixture
    def last_year(self, this_year):
        return this_year.replace(year=this_year.year - 1)

    @pytest.fixture(autouse=True)
    def stop_data(self, durham, this_year, last_year):
        # Easy math 50% White, 50% Black population
        NCCensusProfileFactory(
            acs_id="durham",
            race="White",
            population=50,
            population_total=100,
            population_percent=0.5,
        )
        NCCensusProfileFactory(
            acs_id="durham",
            race="Black",
            population=50,
            population_total=100,
            population_percent=0.5,
        )
        # 40% black stopped, 20% white stopped this year
        PersonFactory.create_batch(
            size=20,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=this_year,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=this_year,
        )
        # 32% black stopped, 20% white stopped last year
        PersonFactory.create_batch(
            size=16,
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=last_year,
        )
        PersonFactory.create_batch(
            size=10,
            race=DriverRace.WHITE,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__date=last_year,
        )
        # Likelihood depends on StopSummary, so refresh it first
        StopSummary.refresh()
        LikelihoodStopSummary.refresh()

    def test_stop_rate(self, this_year):
        """Test materialized view for stop rates this year."""
        df = pd.DataFrame(LikelihoodStopSummary.objects.filter(year=this_year.year).values())
        black_drivers = df["driver_race_comb"] == "Black"
        white_drivers = df["driver_race_comb"] == "White"
        # Test census data
        assert df[black_drivers]["population"].sum() == 50
        assert df[black_drivers]["population_percent"].sum() == 0.5
        assert df[white_drivers]["population"].sum() == 50
        assert df[white_drivers]["population_percent"].sum() == 0.5
        # Stop rate should be 40% for black drivers (20 stops / 50 population)
        assert df[black_drivers]["stops"].sum() == 20
        assert df[black_drivers]["stop_rate"].sum() == Decimal("0.4")
        # Stop rate should be 20% for white drivers (10 stops / 50 population)
        assert df[white_drivers]["stops"].sum() == 10
        assert df[white_drivers]["stop_rate"].sum() == Decimal("0.2")
        # Total stops should be 30 (20 black drivers, 10 white drivers)
        assert df[black_drivers]["stops_total"].sum() == 30
        assert df[white_drivers]["stops_total"].sum() == 30
        # Baseline rate should be 20% for both (baseline = white drivers)
        assert df[black_drivers]["baseline_rate"].sum() == Decimal("0.2")
        assert df[white_drivers]["baseline_rate"].sum() == Decimal("0.2")
        # Stop rate ratio should be 1.0 for black drivers, or twice as likely to be stopped
        assert df[black_drivers]["stop_rate_ratio"].sum() == Decimal("1.0")

    def test_likelihood_stop_query(self, rf, durham):
        """Test likelihood_stop_query function."""
        df = likelihood_stop_query(rf.get(""), agency_id=durham.id)
        assert df.columns.tolist() == [
            "id",
            "agency_id",
            "driver_race",
            "population",
            "population_total",
            "population_percent",
            "stops",
            "stops_total",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
        ]
        # Statewide works too
        df = likelihood_stop_query(rf.get(""), agency_id=STATEWIDE)
        assert df.columns.tolist() == [
            "id",
            "agency_id",
            "driver_race",
            "population",
            "population_total",
            "population_percent",
            "stops",
            "stops_total",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
        ]

    def test_likelihood_stop_view_last_year(self, client, durham):
        """Test likelihood of stop API view."""
        url = reverse("nc:likelihood-of-stops", args=[durham.id])
        # Defauls to stops from last year
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # Stop rate ratio should be 1.5 for black drivers
        assert data["stop_percentages"] == [0.6]
        table_data = data["table_data"]
        # Only one row for black drivers
        assert len(table_data) == 1
        # Stop rate ratio should be 1.5 for black drivers
        stop_rate = table_data[0]["stop_rate"]
        baseline_rate = table_data[0]["baseline_rate"]
        assert stop_rate == 0.32  # 32% stop rate for black drivers
        assert baseline_rate == 0.2  # 20% baseline stop rate for white drivers
        stop_rate_ratio = (stop_rate - baseline_rate) / baseline_rate
        # 12% / 20% = 0.6, or 60% more likely to be stopped
        assert pytest.approx(stop_rate_ratio) == 0.6
        assert table_data[0]["stop_rate_ratio"] == pytest.approx(stop_rate_ratio)

    def test_likelihood_stop_view_this_year(self, client, durham, this_year):
        """Test likelihood of stop API view with year querysting parameter."""
        url = reverse_querystring(
            "nc:likelihood-of-stops", args=[durham.id], query_kwargs={"year": this_year.year}
        )
        response = client.get(url, format="json")
        assert response.status_code == 200
        data = response.json()
        # Stop rate ratio should be 1.0 for black drivers, or twice as likely to be stopped
        assert data["stop_percentages"] == [1.0]
