import datetime

import factory
import factory.fuzzy

from nc import models


class ViewRefreshFactory(factory.django.DjangoModelFactory):
    """
    Refresh materialized view after object creation so tests don't have to
    manually invoke this functionality.
    """

    @factory.post_generation
    def refresh_view(obj, create, extracted, **kwargs):
        models.StopSummary.refresh()
        models.ContrabandSummary.refresh()


class AgencyFactory(ViewRefreshFactory):
    class Meta(object):
        model = models.Agency

    name = factory.Sequence(lambda n: "Agency %03d" % n)


class PersonFactory(ViewRefreshFactory):
    class Meta(object):
        model = models.Person

    person_id = factory.Sequence(lambda x: x)
    stop = factory.SubFactory("nc.tests.factories.StopFactory")
    age = factory.fuzzy.FuzzyInteger(16, 100)
    race = factory.fuzzy.FuzzyChoice(x[0] for x in models.RACE_CHOICES)
    ethnicity = factory.fuzzy.FuzzyChoice(x[0] for x in models.ETHNICITY_CHOICES)
    type = "D"


class StopFactory(ViewRefreshFactory):
    class Meta(object):
        model = models.Stop

    stop_id = factory.Sequence(lambda x: x)
    agency = factory.SubFactory(AgencyFactory)
    date = factory.fuzzy.FuzzyDateTime(
        datetime.datetime(2008, 1, 1, 0, 0, tzinfo=datetime.timezone.utc)
    )
    purpose = factory.fuzzy.FuzzyChoice(x[0] for x in models.PURPOSE_CHOICES)
    action = factory.fuzzy.FuzzyChoice(x[0] for x in models.ACTION_CHOICES)
    officer_id = factory.fuzzy.FuzzyInteger(0)

    @factory.post_generation
    def year(self, create, extracted, **kwargs):
        """Wrapper to easily set stop date's year in test case"""
        if not create:
            return
        if extracted:
            day = 1 if self.date.month == 2 else self.date.day
            self.date = self.date.replace(year=extracted, day=day)


class SearchFactory(ViewRefreshFactory):
    class Meta(object):
        model = models.Search

    search_id = factory.Sequence(lambda x: x)
    stop = factory.SubFactory(StopFactory)
    person = factory.SubFactory(PersonFactory)
    type = factory.fuzzy.FuzzyChoice(x[0] for x in models.SEARCH_TYPE_CHOICES)


class ContrabandFactory(ViewRefreshFactory):
    class Meta(object):
        model = models.Contraband

    contraband_id = factory.Sequence(lambda x: x)
    search = factory.SubFactory(SearchFactory)
    person = factory.SubFactory(PersonFactory)
    stop = factory.SubFactory(StopFactory)
