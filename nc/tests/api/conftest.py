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
    return factories.AgencyFactory(name="Durham")
