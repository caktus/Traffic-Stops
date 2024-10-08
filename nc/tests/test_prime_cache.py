from django.test import TestCase

from nc.prime_cache import run
from nc.tests import factories


class PrimeCacheTests(TestCase):
    """
    This merely gives the cache priming code a chance to blow up if silly
    changes are made.  No results are verified.
    """

    databases = "__all__"

    def test_prime_cache(self):
        factories.AgencyFactory(id=-1)  # Statewide data

        factories.ContrabandFactory()
        factories.ContrabandFactory()
        factories.ContrabandFactory()
        factories.ContrabandFactory()
        factories.ContrabandFactory()
        run()
