import datetime

import pytz

from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from nc.models import PURPOSE_CHOICES, RACE_CHOICES, SEARCH_TYPE_CHOICES, StopSummary
from nc.tests import factories
from nc.views import GROUPS
from tsdata.tests.factories import CensusProfileFactory


class AgencyTests(APITestCase):
    databases = "__all__"

    # Hispanic vs non-Hispanic ethnicity is tracked separately on
    # tickets, and thus is a separate field in the database for the NC
    # data, but now we are breaking out individuals marked as Hispanic
    # as a distinct racial group.

    def test_list_agencies(self):
        """Test Agency list"""
        agency = factories.AgencyFactory()
        url = reverse("nc:agency-api-list")
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Other Agencies may have been left around from other tests
        self.assertIn((agency.pk, agency.name), [(a["id"], a["name"]) for a in response_data])

    def test_agency_census_data(self):
        """
        Construct an agency with associated CensusProfile, check
        for inclusion of reasonable data
        """
        census_profile = CensusProfileFactory()
        agency = factories.AgencyFactory(census_profile_id=census_profile.acs_id)
        url = reverse("nc:agency-api-detail", args=[agency.pk])
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("census_profile", response_data)
        # CensusProfile tests check census data in more detail
        for attr in ("hispanic", "non_hispanic", "total"):
            self.assertEqual(response_data["census_profile"][attr], getattr(census_profile, attr))

    def test_stops_api(self):
        """Test Agency stops API endpoint with no stops"""
        agency = factories.AgencyFactory()
        StopSummary.refresh()
        url = reverse("nc:agency-api-stops", args=[agency.pk])
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 0)

    def test_stops_count(self):
        """Test Agency stop counts"""
        agency = factories.AgencyFactory()
        # Create the following racial data for 2010:
        # 2 black, 1 white, 3 hispanic
        factories.PersonFactory(race="B", stop__agency=agency, ethnicity="N", stop__year=2010)
        factories.PersonFactory(race="B", stop__agency=agency, ethnicity="N", stop__year=2010)
        factories.PersonFactory(race="W", stop__agency=agency, ethnicity="N", stop__year=2010)
        factories.PersonFactory(race="W", stop__agency=agency, ethnicity="H", stop__year=2010)
        factories.PersonFactory(race="A", stop__agency=agency, ethnicity="H", stop__year=2010)
        factories.PersonFactory(race="A", stop__agency=agency, ethnicity="H", stop__year=2010)
        # Create the following racial data for 2012:
        # 0 black, 1 white, 4 hispanic
        factories.PersonFactory(race="W", stop__agency=agency, ethnicity="H", stop__year=2012)
        factories.PersonFactory(race="W", stop__agency=agency, ethnicity="N", stop__year=2012)
        factories.PersonFactory(race="B", stop__agency=agency, ethnicity="H", stop__year=2012)
        factories.PersonFactory(race="B", stop__agency=agency, ethnicity="H", stop__year=2012)
        factories.PersonFactory(race="I", stop__agency=agency, ethnicity="H", stop__year=2012)
        StopSummary.refresh()

        url = reverse("nc:agency-api-stops", args=[agency.pk])
        response = self.client.get(url, format="application/json")
        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data[0]["year"], 2010)
        self.assertEqual(response_data[0]["black"], 2)
        self.assertEqual(response_data[0]["white"], 1)
        self.assertEqual(response_data[0]["asian"], 0)
        self.assertEqual(response_data[0]["hispanic"], 3)
        self.assertEqual(response_data[1]["year"], 2012)
        self.assertEqual(response_data[1]["black"], 0)
        self.assertEqual(response_data[1]["white"], 1)
        self.assertEqual(response_data[1]["hispanic"], 4)

    def test_grouping_by_year(self):
        """
        Create one stop right at the end of the year in North Carolina and another
        stop a day later and ensure that the stops are counted in the expected
        years.
        """
        nc_timezone = pytz.timezone(settings.NC_TIME_ZONE)
        year = 2015
        end_of_year = nc_timezone.localize(
            datetime.datetime(year=year, month=12, day=31, hour=23, minute=59)
        )
        agency = factories.AgencyFactory()
        race_code, _ = RACE_CHOICES[1]
        race_label = GROUPS[race_code]
        factories.PersonFactory(
            race=race_code, ethnicity="N", stop__agency=agency, stop__date=end_of_year
        )
        factories.PersonFactory(
            race=race_code,
            ethnicity="H",
            stop__agency=agency,
            stop__date=end_of_year + datetime.timedelta(days=1),
        )
        StopSummary.refresh()
        url = reverse("nc:agency-api-stops", args=[agency.pk])
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 2)
        self.assertEqual(response_data[0]["year"], year)
        self.assertEqual(response_data[0][race_label], 1)
        self.assertEqual(response_data[1]["year"], year + 1)
        self.assertEqual(response_data[1]["hispanic"], 1)

    def test_officer_stops_count(self):
        """Test officer (within an agency) stop counts"""
        agency = factories.AgencyFactory()
        p1 = factories.PersonFactory(ethnicity="N", stop__agency=agency, stop__year=2016)
        p2 = factories.PersonFactory(
            ethnicity="H", stop__agency=agency, stop__year=2017, stop__officer_id=p1.stop.officer_id
        )
        factories.PersonFactory(
            ethnicity="H", stop__agency=agency, stop__year=2017, stop__officer_id=p1.stop.officer_id
        )
        StopSummary.refresh()
        url = reverse("nc:agency-api-stops", args=[agency.pk])
        url = f"{url}?officer={p1.stop.officer_id}"
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 2)
        self.assertEqual(response_data[0]["year"], p1.stop.date.year)
        self.assertEqual(response_data[1]["year"], p2.stop.date.year)
        self.assertEqual(response_data[1]["hispanic"], 2)

    def test_stops_by_reason(self):
        """Test Agency stops_by_reason API endpoint"""
        agency = factories.AgencyFactory()
        url = reverse("nc:agency-api-stops-by-reason", args=[agency.pk])

        purpose_code, purpose_label = PURPOSE_CHOICES[4]
        # Create the following racial data for 2010: 2 black, 3 hispanic
        factories.PersonFactory(
            race="B",
            stop__agency=agency,
            ethnicity="N",
            stop__year=2010,
            stop__purpose=purpose_code,
        )
        p2 = factories.PersonFactory(
            race="B",
            stop__agency=agency,
            ethnicity="H",
            stop__year=2010,
            stop__purpose=purpose_code,
        )
        p3 = factories.PersonFactory(
            race="I",
            stop__agency=agency,
            ethnicity="H",
            stop__year=2010,
            stop__purpose=purpose_code,
        )
        p4 = factories.PersonFactory(
            race="I",
            stop__agency=agency,
            ethnicity="H",
            stop__year=2010,
            stop__purpose=purpose_code,
        )
        # Create the following racial data for 2012: 1 black
        p5 = factories.PersonFactory(
            race="B",
            stop__agency=agency,
            ethnicity="N",
            stop__year=2012,
            stop__purpose=purpose_code,
        )
        # Everyone except for the first person got searched, so the expected
        # search data for 2010 are: 1 black, 3 hispanic, and for 2012 is: 1 black
        factories.SearchFactory(stop=p2.stop)
        factories.SearchFactory(stop=p3.stop)
        factories.SearchFactory(stop=p4.stop)
        factories.SearchFactory(stop=p5.stop)
        StopSummary.refresh()

        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data.keys()), 2)

        searches = response_data["searches"]
        self.assertEqual(searches[0]["year"], 2010)
        self.assertEqual(searches[0]["black"], 0)
        self.assertEqual(searches[0]["hispanic"], 3)
        self.assertEqual(searches[0]["purpose"], purpose_label)
        self.assertEqual(searches[1]["year"], 2012)
        self.assertEqual(searches[1]["black"], 1)
        self.assertEqual(searches[1]["purpose"], purpose_label)

        stops = response_data["stops"]
        self.assertEqual(stops[0]["year"], 2010)
        self.assertEqual(stops[0]["black"], 1)
        self.assertEqual(stops[0]["hispanic"], 3)
        self.assertEqual(stops[0]["purpose"], purpose_label)
        self.assertEqual(stops[1]["year"], 2012)
        self.assertEqual(stops[1]["black"], 1)
        self.assertEqual(stops[1]["purpose"], purpose_label)

    def test_searches(self):
        """Test Agency search counts"""
        agency = factories.AgencyFactory()
        # Create the following racial data for 2015: 1 black
        p1 = factories.PersonFactory(race="B", ethnicity="N", stop__agency=agency, stop__year=2015)
        s1 = factories.SearchFactory(person=p1, stop=p1.stop)
        # Create the following racial data for 2016: 1 native american, 3 hispanic
        p2 = factories.PersonFactory(race="W", ethnicity="H", stop__agency=agency, stop__year=2016)
        s2 = factories.SearchFactory(person=p2, stop=p2.stop)
        p3 = factories.PersonFactory(race="B", ethnicity="H", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p3, stop=p3.stop)
        p4 = factories.PersonFactory(race="B", ethnicity="H", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p4, stop=p4.stop)
        p5 = factories.PersonFactory(race="I", ethnicity="N", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p5, stop=p5.stop)
        StopSummary.refresh()
        url = reverse("nc:agency-api-searches", args=[agency.pk])
        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 2)
        # Everyone got searched, so the expected racial data for 2015 are: 1 black,
        # and for 2016 are: 1 native american, 3 hispanic
        self.assertEqual(response_data[0]["year"], s1.stop.date.year)
        self.assertEqual(response_data[0]["black"], 1)
        self.assertEqual(response_data[1]["year"], s2.stop.date.year)
        self.assertEqual(response_data[1]["black"], 0)
        self.assertEqual(response_data[1]["native_american"], 1)
        self.assertEqual(response_data[1]["hispanic"], 3)

    def test_searches_by_reason(self):
        agency = factories.AgencyFactory()
        url = reverse("nc:agency-api-searches-by-type", args=[agency.pk])

        type_code, type_label = SEARCH_TYPE_CHOICES[2]

        # Create the following racial data for 2015: 1 black
        p1 = factories.PersonFactory(race="B", ethnicity="N", stop__agency=agency, stop__year=2015)
        factories.SearchFactory(person=p1, stop=p1.stop, type=type_code)

        # Create the following racial data for 2016: 1 native american, 3 hispanic
        p2 = factories.PersonFactory(race="W", ethnicity="H", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p2, stop=p2.stop, type=type_code)
        p3 = factories.PersonFactory(race="B", ethnicity="H", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p3, stop=p3.stop, type=type_code)
        p4 = factories.PersonFactory(race="B", ethnicity="H", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p4, stop=p4.stop, type=type_code)
        p5 = factories.PersonFactory(race="I", ethnicity="N", stop__agency=agency, stop__year=2016)
        factories.SearchFactory(person=p5, stop=p5.stop, type=type_code)
        StopSummary.refresh()

        response = self.client.get(url, format="json")
        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Two years = two items
        self.assertEqual(len(response_data), 2)

        self.assertEqual(response_data[0]["year"], 2015)
        self.assertEqual(response_data[0]["black"], 1)
        self.assertEqual(response_data[0]["search_type"], type_label)
        self.assertEqual(response_data[1]["year"], 2016)
        self.assertEqual(response_data[1]["hispanic"], 3)
        self.assertEqual(response_data[1]["native_american"], 1)
        self.assertEqual(response_data[1]["search_type"], type_label)

    def test_use_of_force(self):
        pass
