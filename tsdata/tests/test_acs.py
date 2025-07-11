from django.test import TestCase

from tsdata import acs


class ACSTests(TestCase):
    expected_race_variables = [
        "total",
        "white",
        "black",
        "native_american",
        "asian",
        "native_hawaiian",
        "other",
        "two_or_more_races",
        "hispanic",
        "non_hispanic",
    ]

    def test_nc_variables(self):
        acs_obj = acs.ACS(key="", state_abbr="NC", year=2020)
        self.assertCountEqual(acs_obj.race_variables.values(), self.expected_race_variables)
        self.assertCountEqual(
            acs_obj.variables,
            [
                "NAME",
                "GEO_ID",
                "B03002_001E",
                "B03002_003E",
                "B03002_004E",
                "B03002_005E",
                "B03002_006E",
                "B03002_007E",
                "B03002_008E",
                "B03002_009E",
                "B03002_012E",
                "B03002_002E",
            ],
        )

    def test_other_state(self):
        with self.assertRaises(KeyError):
            acs.ACS(key="", state_abbr="NY", year=2020)
