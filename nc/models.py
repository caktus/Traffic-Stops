from caching.base import CachingManager, CachingMixin
from django.db import models
from django_pgviews import view as pg

from tsdata.models import CensusProfile

PURPOSE_CHOICES = (
    (1, "Speed Limit Violation"),
    (2, "Stop Light/Sign Violation"),
    (3, "Driving While Impaired"),
    (4, "Safe Movement Violation"),
    (5, "Vehicle Equipment Violation"),
    (6, "Vehicle Regulatory Violation"),
    (7, "Seat Belt Violation"),
    (8, "Investigation"),
    (9, "Other Motor Vehicle Violation"),
    (10, "Checkpoint"),
)

ACTION_CHOICES = (
    (1, "Verbal Warning"),
    (2, "Written Warning"),
    (3, "Citation Issued"),
    (4, "On-View Arrest"),
    (5, "No Action Taken"),
)


PERSON_TYPE_CHOICES = (("D", "Driver"), ("P", "Passenger"))


GENDER_CHOICES = (("M", "Male"), ("F", "Female"))


ETHNICITY_CHOICES = (("H", "Hispanic"), ("N", "Non-Hispanic"))


RACE_CHOICES = (
    ("A", "Asian"),
    ("B", "Black"),
    ("I", "Native American"),
    ("U", "Other"),
    ("W", "White"),
)


SEARCH_TYPE_CHOICES = (
    (1, "Consent"),
    (2, "Search Warrant"),
    (3, "Probable Cause"),
    (4, "Search Incident to Arrest"),
    (5, "Protective Frisk"),
)


SEARCH_BASIS_CHOICES = (
    ("ER", "Erratic/Suspicious Behavior"),
    ("OB", "Observation of Suspected Contraband"),
    ("OI", "Other Official Information"),
    ("SM", "Suspicious Movement"),
    ("TIP", "Informant Tip"),
    ("WTNS", "Witness Observation"),
)


class Stop(CachingMixin, models.Model):
    stop_id = models.PositiveIntegerField(primary_key=True)
    agency_description = models.CharField(max_length=100)
    agency = models.ForeignKey("Agency", null=True, related_name="stops", on_delete=models.CASCADE)
    date = models.DateTimeField(db_index=True)
    purpose = models.PositiveSmallIntegerField(choices=PURPOSE_CHOICES)
    action = models.PositiveSmallIntegerField(choices=ACTION_CHOICES)
    driver_arrest = models.BooleanField(default=False)
    passenger_arrest = models.BooleanField(default=False)
    encounter_force = models.BooleanField(default=False)
    engage_force = models.BooleanField(default=False)
    officer_injury = models.BooleanField(default=False)
    driver_injury = models.BooleanField(default=False)
    passenger_injury = models.BooleanField(default=False)
    officer_id = models.CharField(max_length=15)  # todo: keys
    stop_location = models.CharField(max_length=15)  # todo: keys
    stop_city = models.CharField(max_length=20)

    objects = CachingManager()


class Person(CachingMixin, models.Model):
    person_id = models.IntegerField(primary_key=True)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    type = models.CharField(max_length=2, choices=PERSON_TYPE_CHOICES)
    age = models.PositiveSmallIntegerField()
    gender = models.CharField(max_length=2, choices=GENDER_CHOICES)
    ethnicity = models.CharField(max_length=2, choices=ETHNICITY_CHOICES)
    race = models.CharField(max_length=2, choices=RACE_CHOICES)

    objects = CachingManager()


class Search(CachingMixin, models.Model):
    search_id = models.IntegerField(primary_key=True)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    type = models.PositiveSmallIntegerField(choices=SEARCH_TYPE_CHOICES)
    vehicle_search = models.BooleanField(default=False)
    driver_search = models.BooleanField(default=False)
    passenger_search = models.BooleanField(default=False)
    property_search = models.BooleanField(default=False)
    vehicle_siezed = models.BooleanField(default=False)
    personal_property_siezed = models.BooleanField(default=False)
    other_property_sized = models.BooleanField(default=False)

    objects = CachingManager()


class Contraband(CachingMixin, models.Model):
    contraband_id = models.IntegerField(primary_key=True)
    search = models.ForeignKey(Search, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    ounces = models.FloatField(default=0, null=True)
    pounds = models.FloatField(default=0, null=True)
    pints = models.FloatField(default=0, null=True)
    gallons = models.FloatField(default=0, null=True)
    dosages = models.FloatField(default=0, null=True)
    grams = models.FloatField(default=0, null=True)
    kilos = models.FloatField(default=0, null=True)
    money = models.FloatField(default=0, null=True)
    weapons = models.FloatField(default=0, null=True)
    dollar_amount = models.FloatField(default=0, null=True)

    objects = CachingManager()


class SearchBasis(CachingMixin, models.Model):
    search_basis_id = models.IntegerField(primary_key=True)
    search = models.ForeignKey(Search, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    basis = models.CharField(max_length=4, choices=SEARCH_BASIS_CHOICES)

    objects = CachingManager()


class Agency(CachingMixin, models.Model):
    name = models.CharField(max_length=255)
    # link to CensusProfile (no cross-database foreign key)
    census_profile_id = models.CharField(max_length=16, blank=True, default="")
    last_reported_stop = models.DateField(null=True)

    objects = CachingManager()

    class Meta(object):
        verbose_name_plural = "Agencies"

    def __str__(self):
        return self.name

    @property
    def census_profile(self):
        if self.census_profile_id:
            profile = CensusProfile.objects.get(id=self.census_profile_id)
            return profile.get_census_dict()
        else:
            return dict()


STOP_SUMMARY_VIEW_SQL = """
    SELECT
        ROW_NUMBER() OVER () AS id
        , "nc_stop"."agency_id"
        , DATE_TRUNC('month', date AT TIME ZONE 'America/New_York') AS "date"
        , "nc_stop"."purpose" AS "stop_purpose"
        , "nc_stop"."engage_force"
        , "nc_search"."type" AS "search_type"
        , (CASE
            WHEN nc_contraband.contraband_id IS NULL THEN false
            ELSE true
            END) AS contraband_found
        , "nc_stop"."officer_id"
        , "nc_person"."race" AS "driver_race"
        , "nc_person"."ethnicity" AS "driver_ethnicity"
        , COUNT("nc_stop"."date")::integer AS "count"
    FROM "nc_stop"
    INNER JOIN "nc_person"
        ON ("nc_stop"."stop_id" = "nc_person"."stop_id" AND "nc_person"."type" = 'D')
    LEFT OUTER JOIN "nc_search"
        ON ("nc_stop"."stop_id" = "nc_search"."stop_id")
    LEFT OUTER JOIN "nc_contraband"
        ON ("nc_stop"."stop_id" = "nc_contraband"."stop_id")
    GROUP BY
        2, 3, 4, 5, 6, 7, 8, 9, 10
    ORDER BY "agency_id", "date" ASC;
"""  # noqa


class StopSummary(pg.ReadOnlyMaterializedView):
    sql = STOP_SUMMARY_VIEW_SQL
    # Don't create view with data, this will be manually managed
    # and refreshed by the data import process
    # https://github.com/mikicz/django-pgviews#with-no-data
    with_data = False

    id = models.PositiveIntegerField(primary_key=True)
    date = models.DateTimeField()
    agency = models.ForeignKey("Agency", on_delete=models.DO_NOTHING)
    stop_purpose = models.PositiveSmallIntegerField(choices=PURPOSE_CHOICES)
    engage_force = models.BooleanField()
    search_type = models.PositiveSmallIntegerField(choices=SEARCH_TYPE_CHOICES)
    contraband_found = models.BooleanField()
    officer_id = models.CharField(max_length=15)
    driver_race = models.CharField(max_length=2, choices=RACE_CHOICES)
    driver_ethnicity = models.CharField(max_length=2, choices=ETHNICITY_CHOICES)
    count = models.IntegerField()

    class Meta:
        managed = False
        indexes = [
            models.Index(fields=["agency", "officer_id", "search_type"]),
            models.Index(fields=["engage_force"]),
            models.Index(fields=["contraband_found"]),
        ]


class Resource(models.Model):
    created_date = models.DateTimeField(auto_now_add=True, editable=False)
    publication_date = models.DateField(null=True, blank=True, editable=True)
    RESOURCE_IMAGES = [
        ("copwatch-new-policy", "New Policy"),
        ("forward-justice-logo", "Forward Justice Logo"),
    ]
    agencies = models.ManyToManyField("Agency", related_name="resources")
    title = models.CharField(max_length=500, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    image = models.CharField(null=True, blank=True, choices=RESOURCE_IMAGES, max_length=200)
    view_more_link = models.URLField(null=True, blank=True)

    class Meta:
        ordering = ("-created_date",)

    def __str__(self):
        return f"{self.title}"
