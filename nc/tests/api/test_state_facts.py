import factory
import pytest
from django.conf import settings
from tsdata.models import StateFacts

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "attr",
    [
        "total_stops",
        "total_stops_millions",
        "total_searches",
        "total_agencies",
        "start_date",
        "end_date",
    ],
)
def test_state_facts(client, facts_url, attr):
    facts = StateFacts.objects.get(state_key=settings.NC_KEY)  # always exists
    facts.total_stops = factory.Faker("random_number", digits=9).generate()
    facts.total_stops_millions = factory.Faker("random_number", digits=2).generate()
    facts.total_searches = factory.Faker("random_number", digits=5).generate()
    facts.total_agencies = factory.Faker("random_number", digits=3).generate()
    facts.start_date = "Jan 1, 2000"
    facts.end_date = "Jan 1, 2020"
    facts.save()
    response = client.get(facts_url, format="json")
    result = response.data[0]
    assert getattr(facts, attr) == result[attr]
