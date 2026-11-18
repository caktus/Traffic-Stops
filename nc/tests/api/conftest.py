import pytest

from django.urls import reverse

from nc.tests import factories


@pytest.fixture
def search_url():
    return reverse("nc:driver-stops-api-list")


@pytest.fixture
def facts_url():
    return reverse("nc:state-facts-list")


@pytest.fixture
def durham():
    return factories.AgencyFactory(name="Durham", census_profile_id="durham")


@pytest.fixture
def raleigh():
    return factories.AgencyFactory(name="Raleigh", census_profile_id="raleigh")


@pytest.fixture
def nc_state():
    return factories.AgencyFactory(name="NC", census_profile_id="nc", id=-1)
