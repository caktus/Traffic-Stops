"""Link Agency records to County records via pygris spatial join."""

import logging

import geopandas as gpd
import pygris

from nc.models import Agency, County

logger = logging.getLogger(__name__)


def link_agencies_to_counties():
    """
    Use pygris to spatially join NC places to counties (via centroids),
    then set Agency.county for each agency whose census_profile_id matches
    a place ACS ID.
    """
    nc_places = pygris.places(state="NC", cb=True, cache=True)
    nc_counties = pygris.counties(state="NC", cb=True, cache=True)

    # Compute centroids (project to EPSG:3857 for accuracy, then back)
    nc_places_proj = nc_places.to_crs(epsg=3857)
    nc_places_centroids = nc_places_proj.copy()
    nc_places_centroids["geometry"] = nc_places_centroids.geometry.centroid
    nc_places_centroids = nc_places_centroids.to_crs(nc_counties.crs)

    # Spatial join: which county does each place centroid fall in?
    joined = gpd.sjoin(nc_places_centroids, nc_counties, how="left", predicate="within")

    # Build mapping: place ACS ID (GEOIDFQ_left) -> county FIPS (GEOID_right)
    place_acs_to_county_fips = {}
    for _, row in joined.iterrows():
        place_acs_id = row.get("GEOIDFQ_left", "")
        county_fips = row.get("GEOID_right", "")
        if place_acs_id and county_fips:
            place_acs_to_county_fips[place_acs_id] = county_fips

    # Build set of valid county IDs for direct matching
    county_ids = set(County.objects.values_list("id", flat=True))

    updated = []
    for agency in Agency.objects.filter(county__isnull=True).exclude(census_profile_id=""):
        county_fips = None

        # Check if agency census_profile_id is already county-level (0500000US37XXX)
        if agency.census_profile_id.startswith("0500000US37"):
            county_fips = agency.census_profile_id[-5:]
        else:
            # Place-level: look up via spatial join
            county_fips = place_acs_to_county_fips.get(agency.census_profile_id)

        if county_fips and county_fips in county_ids:
            agency.county_id = county_fips
            updated.append(agency)

    if updated:
        Agency.objects.bulk_update(updated, ["county_id"])
        logger.info(f"Linked {len(updated)} agencies to counties")
    else:
        logger.info("No agencies needed county linking")
