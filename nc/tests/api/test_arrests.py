import pandas as pd
import pytest

from django.test import TestCase
from django.urls import reverse
from django.utils.http import urlencode

from nc.constants import STATEWIDE
from nc.models import DriverEthnicity, DriverRace, StopPurpose
from nc.tests.factories import ContrabandFactory, PersonFactory, SearchFactory
from nc.views.arrests import sort_by_stop_purpose


def reverse_querystring(
    view, urlconf=None, args=None, kwargs=None, current_app=None, query_kwargs=None
):
    """Custom reverse to handle query strings.
    Usage:
        reverse('app.views.my_view', kwargs={'pk': 123}, query_kwargs={'search': 'Bob'})
    """
    base_url = reverse(view, urlconf=urlconf, args=args, kwargs=kwargs, current_app=current_app)
    if query_kwargs:
        return "{}?{}".format(base_url, urlencode(query_kwargs))
    return base_url


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
        """A single stop will result no data for other races"""
        person = PersonFactory(
            race=DriverRace.BLACK, ethnicity=DriverEthnicity.NON_HISPANIC, stop__agency=durham
        )
        search = SearchFactory(stop=person.stop)
        ContrabandFactory(stop=person.stop, person=person, search=search, pints=2)
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
        url = reverse_querystring(
            "nc:arrests-percentage-of-stops", args=[durham.id], query_kwargs={"officer_id": 200}
        )
        response = client.get(url, data={}, format="json")
        assert response.status_code == 200
        assert response.json()["arrest_percentages"] == []
