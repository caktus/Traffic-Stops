import pandas as pd
import pytest

from django.test import TestCase
from django.urls import reverse

from nc.models import DriverEthnicity, DriverRace, StopPurpose
from nc.tests.factories import ContrabandFactory, PersonFactory, SearchFactory
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


@pytest.mark.django_db
class TestArrests:
    def test_arrest_contraband_missing_race(self, client, durham):
        # A single stop will result no data for other races
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        search = SearchFactory(stop=person.stop)
        ContrabandFactory(stop=person.stop, person=person, search=search, pints=2)
        url = reverse("nc:arrests-percentage-of-stops-per-contraband-type", args=[durham.id])
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200
