"""Populate County model from NCCensusProfile county records."""

from django.db import migrations


def populate_counties(apps, schema_editor):
    NCCensusProfile = apps.get_model("nc", "NCCensusProfile")
    County = apps.get_model("nc", "County")

    counties = (
        NCCensusProfile.objects.filter(geography="county", year=2023)
        .values("location", "acs_id")
        .distinct()
    )
    for row in counties:
        fips = row["acs_id"][-5:]  # e.g. "0500000US37063" -> "37063"
        # location is like "Durham County, North Carolina"
        county_name = row["location"].split(",")[0].strip()
        County.objects.get_or_create(
            id=fips,
            defaults={"county_name": county_name, "census_profile_id": row["acs_id"]},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("nc", "0018_county_and_agency_county_fk"),
    ]

    operations = [
        migrations.RunPython(populate_counties, migrations.RunPython.noop),
    ]
