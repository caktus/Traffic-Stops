from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from traffic_stops.healthchecks import HealthcheckSignal, ping_healthcheck


class HealthcheckTests(SimpleTestCase):
    @override_settings(HEALTHCHECKSIO_PING_KEY="")
    @patch("traffic_stops.healthchecks.requests.get")
    def test_ping_healthcheck_returns_false_when_ping_key_unset(self, mock_get):
        result = ping_healthcheck(slug="import-dataset", signal=HealthcheckSignal.SUCCESS)

        self.assertFalse(result)
        mock_get.assert_not_called()
