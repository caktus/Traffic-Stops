from collections import namedtuple
from unittest.mock import patch

import pytest

from nc.tasks import prime_groups_cache

EndpointGroup = namedtuple("EndpointGroup", ["agency_id", "num_stops"])


def make_groups(n):
    return [EndpointGroup(agency_id=i, num_stops=1000 - i) for i in range(n)]


@pytest.mark.django_db
class TestPrimeGroupsCache:
    @patch("nc.tasks.prime_group_cache")
    @patch("nc.prime_cache.get_agencies_and_officers")
    def test_no_cutoff_queues_all(self, mock_get, mock_task):
        mock_get.return_value = make_groups(10)
        prime_groups_cache(cutoff_count=0)
        assert mock_task.delay.call_count == 10

    @patch("nc.tasks.prime_group_cache")
    @patch("nc.prime_cache.get_agencies_and_officers")
    def test_cutoff_limits_to_top_n(self, mock_get, mock_task):
        mock_get.return_value = make_groups(10)
        prime_groups_cache(cutoff_count=3)
        assert mock_task.delay.call_count == 3
        queued_ids = [c.kwargs["agency_id"] for c in mock_task.delay.call_args_list]
        assert queued_ids == [0, 1, 2]

    @patch("nc.tasks.prime_group_cache")
    @patch("nc.prime_cache.get_agencies_and_officers")
    def test_cutoff_larger_than_groups(self, mock_get, mock_task):
        mock_get.return_value = make_groups(5)
        prime_groups_cache(cutoff_count=100)
        assert mock_task.delay.call_count == 5
