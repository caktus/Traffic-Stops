import datetime as dt

import pytest

from django.conf import settings
from zoneinfo import ZoneInfo

from nc.tests import factories

pytestmark = pytest.mark.django_db
nc_timezone = ZoneInfo(settings.NC_TIME_ZONE)


@pytest.fixture
def july_person(durham):
    stop_date = dt.datetime(2020, 7, 29, 20, 26, tzinfo=nc_timezone)
    return factories.PersonFactory(stop__agency=durham, stop__date=stop_date)


@pytest.fixture
def august_person(durham):
    stop_date = dt.datetime(2020, 8, 1, 1, 15, tzinfo=nc_timezone)
    return factories.PersonFactory(stop__agency=durham, stop__date=stop_date)


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_august_excludes_july_stop(client, search_url, durham, july_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 8, 1)},
        format="json",
    )
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert july_person.stop.stop_id not in stop_ids


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_august_includes_august_stop(client, search_url, durham, august_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 8, 1)},
        format="json",
    )
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert {august_person.stop.stop_id} == stop_ids
    assert august_person.stop.date == response.data["results"][0]["date"]


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_stop_date_after_july_includes_both(client, search_url, durham, july_person, august_person):
    response = client.get(
        search_url,
        data={"agency": durham.pk, "stop_date_after": dt.date(2020, 7, 1)},
        format="json",
    )
    stop_ids = {stop["stop_id"] for stop in response.data["results"]}
    assert july_person.stop.stop_id in stop_ids
    assert august_person.stop.stop_id in stop_ids


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_zoneinfo_creates_timezone_aware_datetimes(durham, july_person, august_person):
    """
    Regression test: Verify that zoneinfo creates properly timezone-aware datetime objects.
    This test ensures the migration from pytz to zoneinfo produces correct results.
    """
    # Both stops should have timezone-aware datetime objects
    assert july_person.stop.date.tzinfo is not None
    assert august_person.stop.date.tzinfo is not None

    # Verify that the timezone is correct (NC timezone)
    assert str(july_person.stop.date.tzinfo) == settings.NC_TIME_ZONE
    assert str(august_person.stop.date.tzinfo) == settings.NC_TIME_ZONE


@pytest.mark.django_db(databases=["traffic_stops_nc"])
def test_zoneinfo_fixture_creates_correct_local_times(july_person):
    """
    Regression test: Verify that fixtures using zoneinfo create correct local times.
    This ensures that the datetime values match expected local times in NC timezone.
    """
    # July fixture should have expected time components
    assert july_person.stop.date.hour == 20
    assert july_person.stop.date.minute == 26
    assert july_person.stop.date.year == 2020
    assert july_person.stop.date.month == 7
    assert july_person.stop.date.day == 29
