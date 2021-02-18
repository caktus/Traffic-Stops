import pytest
from nc.models import RACE_CHOICES
from nc.tests import factories
from rest_framework import status

pytestmark = pytest.mark.django_db


RACE_VALUES = set([v[0] for v in RACE_CHOICES])


def test_no_agency(client, search_url):
    response = client.get(search_url, data={}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_agency_success(client, search_url, durham):
    response = client.get(search_url, data={"agency": durham.pk}, format="json")
    assert response.status_code == status.HTTP_200_OK


def test_response_person_fields(client, search_url, durham):
    person = factories.PersonFactory(stop__agency=durham)
    response = client.get(search_url, data={"agency": durham.pk}, format="json")
    result = response.data["results"][0]
    expected = {
        "stop_id": person.stop.stop_id,
        "person_id": person.person_id,
        "date": person.stop.date,
        "gender": person.get_gender_display(),
        "race": person.get_race_display(),
        "ethnicity": person.get_ethnicity_display(),
        "age": person.age,
        "department": person.stop.agency.name,
        "department_id": person.stop.agency_id,
        "officer_id": str(person.stop.officer_id),
        "stop_purpose": person.stop.get_purpose_display(),
        "stop_action": person.stop.get_action_display(),
    }
    assert result == expected


@pytest.mark.parametrize("race", RACE_VALUES)
def test_race_filtering(client, search_url, durham, race):
    other_races = RACE_VALUES - set(race)
    p1 = factories.PersonFactory(stop__agency=durham, race=race)
    p2 = factories.PersonFactory(stop__agency=durham, race=other_races.pop())
    data = {"agency": durham.pk, "race": p1.race}
    response = client.get(search_url, data=data, format="json")
    person_ids = [r["person_id"] for r in response.data["results"]]
    assert p1.pk in person_ids, data
    assert p2.pk not in person_ids, data
