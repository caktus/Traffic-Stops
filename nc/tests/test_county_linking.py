from unittest.mock import patch

import pytest

from nc.data.county_linking import link_agencies_to_counties
from nc.models import County
from nc.tests.factories import AgencyFactory


@pytest.fixture
def durham_county():
    return County.objects.create(
        id="37063", county_name="Durham County", census_profile_id="0500000US37063"
    )


@pytest.fixture
def wake_county():
    return County.objects.create(
        id="37183", county_name="Wake County", census_profile_id="0500000US37183"
    )


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestCountyModel:
    def test_str(self, durham_county):
        assert str(durham_county) == "Durham County"

    def test_fields(self, durham_county):
        assert durham_county.id == "37063"
        assert durham_county.census_profile_id == "0500000US37063"


@pytest.mark.django_db(databases=["default", "traffic_stops_nc"])
class TestLinkAgenciesToCounties:
    @patch("nc.data.county_linking.pygris")
    def test_links_county_level_agency(self, mock_pygris, durham_county):
        """Agency with county-level census_profile_id gets linked directly."""
        agency = AgencyFactory(census_profile_id="0500000US37063")

        # pygris still needs to return something for the spatial join
        mock_pygris.places.return_value = _empty_geodataframe()
        mock_pygris.counties.return_value = _empty_geodataframe()

        link_agencies_to_counties()

        agency.refresh_from_db()
        assert agency.county == durham_county

    @patch("nc.data.county_linking.pygris")
    def test_skips_already_linked_agency(self, mock_pygris, durham_county):
        """Agencies with county already set are skipped."""
        agency = AgencyFactory(census_profile_id="0500000US37063", county=durham_county)

        mock_pygris.places.return_value = _empty_geodataframe()
        mock_pygris.counties.return_value = _empty_geodataframe()

        link_agencies_to_counties()

        agency.refresh_from_db()
        assert agency.county == durham_county

    @patch("nc.data.county_linking.pygris")
    def test_skips_agency_without_census_profile(self, mock_pygris, durham_county):
        """Agencies without census_profile_id are skipped."""
        agency = AgencyFactory(census_profile_id="")

        mock_pygris.places.return_value = _empty_geodataframe()
        mock_pygris.counties.return_value = _empty_geodataframe()

        link_agencies_to_counties()

        agency.refresh_from_db()
        assert agency.county is None


def _empty_geodataframe():
    """Return a mock GeoDataFrame that behaves enough for the spatial join."""
    import geopandas as gpd

    gdf = gpd.GeoDataFrame(
        {
            "NAME": [],
            "GEOIDFQ": [],
            "GEOID": [],
        },
        geometry=[],
        crs="EPSG:4269",
    )
    return gdf
