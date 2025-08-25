from datetime import timedelta

import faker
import pytest

from rest_framework import status

from nc.models import RACE_CHOICES
from nc.tests import factories

pytestmark = pytest.mark.django_db
fake = faker.Faker()


RACE_VALUES = {v[0] for v in RACE_CHOICES}


def test_no_agency(client, search_url):
    response = client.get(search_url, data={}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_agency_success(client, search_url, durham):
    response = client.get(search_url, data={"agency": durham.pk}, format="json")
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db(databases=["traffic_stops_nc"])
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
    # 'age' should only be included if the user entered an age
    assert "age" not in response.data
    # 'start_date' should only be included if the user entered a start date
    assert "start_date" not in response.data
    # 'end_date' should only be included if the user entered an end date
    assert "end_date" not in response.data


@pytest.mark.django_db(databases=["traffic_stops_nc"])
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


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_age_adjusted(client, search_url, durham):
    """Ensure people aged + or - 2 years of the age the user entered are included
    in search results.
    """
    age = 18
    # Create 5 stops with people within the expected age range
    people = [factories.PersonFactory(stop__agency=durham, age=i) for i in range(age - 2, age + 3)]
    # Create 2 stops with people outside the expected age range and should not
    # be included in the search results
    factories.PersonFactory(stop__agency=durham, age=age - 3)
    factories.PersonFactory(stop__agency=durham, age=age + 3)

    response = client.get(search_url, data={"agency": durham.pk, "age": age}, format="json")

    assert len(response.data["results"]) == len(people)
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert {p.stop.stop_id for p in people} == stop_ids
    # 'age' should be included in the response data, with the entered age and
    # the adjusted age range
    assert response.data["age"] == {"entered": age, "adjusted": (age - 2, age + 2)}


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_range_adjusted(client, search_url, durham):
    """Ensure the date range entered by the user is adjusted such that the start_date
    is 2 days earlier and end_date is 2 days later.
    """
    start_date = fake.past_date()
    end_date = fake.past_date(start_date=start_date)
    # Create some stops within the expected date range
    dates = (
        [start_date, end_date]
        + [start_date - timedelta(d) for d in [1, 2]]
        + [end_date + timedelta(d) for d in [1, 2]]
    )
    people = [factories.PersonFactory(stop__agency=durham, stop__date=d) for d in dates]
    # Create 2 stops outside the expected date range. These should not be included
    # in the search results
    factories.PersonFactory(stop__agency=durham, stop__date=start_date - timedelta(3))
    factories.PersonFactory(stop__agency=durham, stop__date=end_date + timedelta(3))

    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": start_date, "stop_date_before": end_date},
        format="json",
    )

    assert len(response.data["results"]) == len(people)
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert {p.stop.stop_id for p in people} == stop_ids
    # 'start_date' and 'end_date' should be included in the response data, with
    # the entered and adjusted date for each
    assert response.data["start_date"] == {
        "entered": start_date,
        "adjusted": start_date - timedelta(2),
    }
    assert response.data["end_date"] == {"entered": end_date, "adjusted": end_date + timedelta(2)}
