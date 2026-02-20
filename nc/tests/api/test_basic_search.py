from datetime import timedelta

import faker
import pytest

from rest_framework import status

from nc.models import RACE_CHOICES, Person
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
    # 'last_reported_stop' should only be included if no matching stops were found
    assert "last_reported_stop" not in response.data


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
def test_no_stops_found(client, search_url):
    """Ensure the agency's last_reported_stop is included in the response if
    no stops are found.
    """
    agency = factories.AgencyFactory(last_reported_stop=fake.past_date())
    response = client.get(search_url, data={"agency": agency.pk}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get("results") == []
    assert response.data.get("last_reported_stop") == agency.last_reported_stop


@pytest.mark.parametrize("search_age", [True, False])
@pytest.mark.parametrize("search_start_date", [True, False])
@pytest.mark.parametrize("search_end_date", [True, False])
@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_range_and_age_adjusted(
    client, search_url, durham, search_age, search_start_date, search_end_date
):
    """Ensure the date range and age entered by the user is adjusted such that:
    - age is up to 2 years younger or older
    - start date is 2 days earlier
    - end date is 2 days later
    """
    age = 18
    start_date = fake.past_date()
    end_date = fake.past_date(start_date=start_date)
    # Create some stops within the expected date range and age range
    dates = (
        [start_date, end_date]
        + [start_date - timedelta(d) for d in [1, 2]]
        + [end_date + timedelta(d) for d in [1, 2]]
    )
    [
        factories.PersonFactory(
            stop__agency=durham, stop__date=d, age=fake.random_int(age - 2, age + 2)
        )
        for d in dates
    ]
    # Create 2 stops outside the expected date range and age range
    factories.PersonFactory(stop__agency=durham, stop__date=start_date - timedelta(3), age=age - 3)
    factories.PersonFactory(stop__agency=durham, stop__date=end_date + timedelta(3), age=age + 3)

    expected_results = Person.objects.filter(stop__agency=durham)
    expected_results_message = ""
    search_params = {"agency": durham.pk}
    if search_age:
        search_params["age"] = age
        expected_results = expected_results.filter(age__gte=age - 2, age__lte=age + 2)
        expected_results_message = f"with drivers aged {age - 2}-{age + 2}"
    if search_start_date:
        search_params["stop_date_after"] = start_date
        used_start_date = start_date - timedelta(2)
        expected_results = expected_results.filter(stop__date__gte=used_start_date)
        if search_end_date:
            expected_results_message += f" between {used_start_date:%B %d, %Y}"
        else:
            expected_results_message += f" after {used_start_date:%B %d, %Y}"
    if search_end_date:
        search_params["stop_date_before"] = end_date
        used_end_date = end_date + timedelta(2)
        expected_results = expected_results.filter(stop__date__lte=used_end_date)
        if search_start_date:
            expected_results_message += f" and {used_end_date:%B %d, %Y}"
        else:
            expected_results_message += f" before {used_end_date:%B %d, %Y}"

    response = client.get(search_url, data=search_params, format="json")

    assert len(response.data["results"]) == len(expected_results)
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert {p.stop.stop_id for p in expected_results} == stop_ids
    # If the user entered an age and/or a date range, the 'extra_results_message'
    # should be included in the response data
    if expected_results_message:
        assert response.data["extra_results_message"] == expected_results_message.strip()
    else:
        assert "extra_results_message" not in response.data
