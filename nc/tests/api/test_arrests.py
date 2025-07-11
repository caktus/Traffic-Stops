import pandas as pd
import pytest

from django.test import TestCase
from django.urls import reverse

from nc.constants import STATEWIDE
from nc.models import ContrabandSummary, DriverEthnicity, DriverRace, StopPurpose, StopSummary
from nc.tests.factories import ContrabandFactory, PersonFactory, SearchFactory
from nc.tests.urls import reverse_querystring
from nc.views.arrests import sort_by_stop_purpose

class ArrestUtilityTests(TestCase):
    def test_sort_by_stop_purpose(self):
        """Sort DataFrame by stop_purpose column in order of the IntegerChoices"""
        df = pd.DataFrame(
            data={
                "stop_purpose": [
                    StopPurpose.CHECKPOINT,
                    StopPurpose.INVESTIGATION,
                    StopPurpose.SEAT_BELT_VIOLATION,
                    StopPurpose.OTHER_MOTOR_VEHICLE_VIOLATION,
                    StopPurpose.VEHICLE_REGULATORY_VIOLATION,
                    StopPurpose.VEHICLE_EQUIPMENT_VIOLATION,
                    StopPurpose.SAFE_MOVEMENT_VIOLATION,
                    StopPurpose.DRIVING_WHILE_IMPAIRED,
                    StopPurpose.STOP_LIGHT_SIGN_VIOLATION,
                    StopPurpose.SPEED_LIMIT_VIOLATION,
                ],
            }
        )
        self.assertEqual(sort_by_stop_purpose(df)["stop_purpose"].tolist(), StopPurpose.values)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
class TestArrests:
    def test_arrest_contraband_missing_race(self, client, durham):
        """A single stop will result no data for other races"""
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        search = SearchFactory(stop=person.stop)
        ContrabandFactory(stop=person.stop, person=person, search=search, pints=2)
        StopSummary.refresh()
        ContrabandSummary.refresh()
        url = reverse("nc:arrests-percentage-of-stops-per-contraband-type", args=[durham.id])
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200

    def test_statewide(self, client, durham):
        """Individual agency data should report statewide"""
        person = PersonFactory(
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__driver_arrest=True,
        )
        SearchFactory(stop=person.stop, person=person)
        StopSummary.refresh()
        ContrabandSummary.refresh()
        url = reverse("nc:arrests-percentage-of-stops", args=[STATEWIDE])
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200
        assert response.json()["arrest_percentages"]

    def test_officer_limit(self, client, durham):
        """Officer pages should only include stops from that officer"""
        person = PersonFactory(
            race=DriverRace.BLACK,
            ethnicity=DriverEthnicity.NON_HISPANIC,
            stop__agency=durham,
            stop__driver_arrest=True,
            stop__officer_id=100,
        )
        SearchFactory(stop=person.stop, person=person)
        StopSummary.refresh()
        ContrabandSummary.refresh()
        url = reverse_querystring(
            "nc:arrests-percentage-of-stops", args=[durham.id], query_kwargs={"officer": 200}
        )
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200
        assert response.json()["arrest_percentages"] == []

    def test_year_range(self, client, durham):
        """Officer pages should only include stops from that officer"""
        PersonFactory(stop__date="2020-01-15", stop__agency=durham)
        PersonFactory(stop__date="2002-07-15", stop__agency=durham)
        StopSummary.refresh()
        url = reverse("nc:year-range", args=[durham.id])
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200
        assert response.json()["year_range"] == [2020, 2002]
