import pytest

from django.urls import reverse

from nc.models import DriverEthnicity, DriverRace, StopSummary
from nc.tests.factories import PersonFactory, SearchFactory


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestStopsByPercentage:
    def test_single_race_no_type_error(self, client, durham):
        """A single-race dataset must not raise TypeError when calculating percentages (#392)"""
        PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        StopSummary.refresh()
        url = reverse("nc:stops-by-percentage", args=[durham.id])
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestSearchesByPercentage:
    def test_single_race_no_type_error(self, client, durham):
        """A single-race dataset must not raise TypeError when calculating search rates (#393)"""
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        SearchFactory(stop=person.stop, person=person)
        StopSummary.refresh()
        url = reverse("nc:searches-by-percentage", args=[durham.id])
        response = client.get(url)
        assert response.status_code == 200

    def test_zero_stops_no_nan_in_response(self, client, durham):
        """Zero total stops must not produce NaN values in the JSON response (#394)"""
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        SearchFactory(stop=person.stop, person=person)
        StopSummary.refresh()
        url = reverse("nc:searches-by-percentage", args=[durham.id])
        response = client.get(url)
        assert response.status_code == 200
        # All data values in all datasets must be finite numbers
        for dataset in response.json()["datasets"]:
            for value in dataset["data"]:
                assert value == value, f"NaN found in dataset '{dataset['label']}'"


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestSearchRate:
    def test_single_race_no_type_error(self, client, durham):
        """A single-race dataset must not raise TypeError when calculating search rate (#395)"""
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        SearchFactory(stop=person.stop, person=person)
        StopSummary.refresh()
        url = reverse("nc:search-rate", args=[durham.id])
        response = client.get(url)
        assert response.status_code == 200
