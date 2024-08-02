import datetime as dt

import pytest
import pytz

from django.conf import settings

from nc.tests import factories

pytestmark = pytest.mark.django_db
nc_timezone = pytz.timezone(settings.NC_TIME_ZONE)


@pytest.fixture
def july_person(durham):
    stop_date = nc_timezone.localize(dt.datetime(2020, 7, 31, 20, 26))
    return factories.PersonFactory(stop__agency=durham, stop__date=stop_date)


@pytest.fixture
def august_person(durham):
    stop_date = nc_timezone.localize(dt.datetime(2020, 8, 1, 1, 15))
    return factories.PersonFactory(stop__agency=durham, stop__date=stop_date)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_august_excludes_july_stop(client, search_url, durham, july_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 8, 1)},
        format="json",
    )
    stop_ids = set([stop["stop_id"] for stop in response.data["results"]])
    assert july_person.stop.stop_id not in stop_ids


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_august_includes_august_stop(client, search_url, durham, august_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 8, 1)},
        format="json",
    )
    stop_ids = set([stop["stop_id"] for stop in response.data["results"]])
    assert {august_person.stop.stop_id} == stop_ids
    assert august_person.stop.date == response.data["results"][0]["date"]


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_july_includes_both(client, search_url, durham, july_person, august_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 7, 1)},
        format="json",
    )
    stop_ids = set([stop["stop_id"] for stop in response.data["results"]])
    assert july_person.stop.stop_id in stop_ids
    assert august_person.stop.stop_id in stop_ids
