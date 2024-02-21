from caching.base import CachingManager, CachingMixin
from django.db import models
from django.utils.html import format_html
from django_pgviews import view as pg

from tsdata.models import CensusProfile


class StopPurpose(models.IntegerChoices):
    SPEED_LIMIT_VIOLATION = 1, "Speed Limit Violation"  # Safety Violation
    STOP_LIGHT_SIGN_VIOLATION = 2, "Stop Light/Sign Violation"  # Safety Violation
    DRIVING_WHILE_IMPAIRED = 3, "Driving While Impaired"  # Safety Violation
    SAFE_MOVEMENT_VIOLATION = 4, "Safe Movement Violation"  # Safety Violation
    VEHICLE_EQUIPMENT_VIOLATION = 5, "Vehicle Equipment Violation"  # Regulatory and Equipment
    VEHICLE_REGULATORY_VIOLATION = 6, "Vehicle Regulatory Violation"  # Regulatory and Equipment
    OTHER_MOTOR_VEHICLE_VIOLATION = 9, "Other Motor Vehicle Violation"  # Regulatory and Equipment
    SEAT_BELT_VIOLATION = 7, "Seat Belt Violation"  # Regulatory and Equipment
    INVESTIGATION = 8, "Investigation"  # Other
    CHECKPOINT = 10, "Checkpoint"  # Other


class StopPurposeGroup(models.TextChoices):
    SAFETY_VIOLATION = "Safety Violation"
    REGULATORY_EQUIPMENT = "Regulatory and Equipment"
    OTHER = "Other"

    @classmethod
    def safety_violation_purposes(cls):
        return [
            StopPurpose.SPEED_LIMIT_VIOLATION.value,
            StopPurpose.STOP_LIGHT_SIGN_VIOLATION.value,
            StopPurpose.DRIVING_WHILE_IMPAIRED.value,
            StopPurpose.SAFE_MOVEMENT_VIOLATION.value,
        ]

    @classmethod
    def regulatory_purposes(cls):
        return [
            StopPurpose.VEHICLE_EQUIPMENT_VIOLATION.value,
            StopPurpose.VEHICLE_REGULATORY_VIOLATION.value,
            StopPurpose.OTHER_MOTOR_VEHICLE_VIOLATION.value,
            StopPurpose.SEAT_BELT_VIOLATION.value,
        ]

    @classmethod
    def other_purposes(cls):
        return [
            StopPurpose.INVESTIGATION.value,
            StopPurpose.CHECKPOINT.value,
        ]


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


class DriverRace(models.TextChoices):
    ASIAN = "A", "Asian"
    BLACK = "B", "Black"
    HISPANIC = "H", "Hispanic"
    NATIVE_AMERICAN = "I", "Native American"
    OTHER = "U", "Other"
    WHITE = "W", "White"


class DriverEthnicity(models.TextChoices):
    HISPANIC = "H", "Hispanic"
    NON_HISPANIC = "N", "Non-Hispanic"


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


STOP_SUMMARY_VIEW_SQL = f"""
    SELECT
        ROW_NUMBER() OVER () AS id
        , "nc_stop"."agency_id"
        , DATE_TRUNC('month', date AT TIME ZONE 'America/New_York')::date AS "date"
        , "nc_stop"."purpose" AS "stop_purpose"
        , (CASE WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.safety_violation_purposes()))}) THEN 'Safety Violation'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.other_purposes()))}) THEN 'Other'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.regulatory_purposes()))}) THEN 'Regulatory and Equipment'
                ELSE 'Other'
           END) as stop_purpose_group
        , "nc_stop"."engage_force"
        , "nc_search"."type" AS "search_type"
        , (CASE
            WHEN nc_contraband.contraband_id IS NULL THEN false
            ELSE true
            END) AS contraband_found
        , "nc_stop"."officer_id"
        , "nc_person"."race" AS "driver_race"
        , "nc_person"."ethnicity" AS "driver_ethnicity"
        , (CASE WHEN nc_person.ethnicity = 'H' THEN 'Hispanic'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'A' THEN 'Asian'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'B' THEN 'Black'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'I' THEN 'Native American'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'U' THEN 'Other'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'W' THEN 'White'
           END) as driver_race_comb
        , COUNT("nc_stop"."date")::integer AS "count"
    FROM "nc_stop"
    INNER JOIN "nc_person"
        ON ("nc_stop"."stop_id" = "nc_person"."stop_id" AND "nc_person"."type" = 'D')
    LEFT OUTER JOIN "nc_search"
        ON ("nc_stop"."stop_id" = "nc_search"."stop_id")
    LEFT OUTER JOIN "nc_contraband"
        ON ("nc_stop"."stop_id" = "nc_contraband"."stop_id")
    GROUP BY
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ORDER BY "agency_id", "date" ASC;
"""  # noqa


class StopSummary(CachingMixin, pg.ReadOnlyMaterializedView):
    sql = STOP_SUMMARY_VIEW_SQL
    # Don't create view with data, this will be manually managed
    # and refreshed by the data import process
    # https://github.com/mikicz/django-pgviews#with-no-data
    with_data = False

    id = models.PositiveIntegerField(primary_key=True)
    date = models.DateField()
    agency = models.ForeignKey("Agency", on_delete=models.DO_NOTHING)
    stop_purpose = models.PositiveSmallIntegerField(choices=StopPurpose.choices)
    stop_purpose_group = models.CharField(choices=StopPurposeGroup.choices, max_length=32)
    engage_force = models.BooleanField()
    search_type = models.PositiveSmallIntegerField(choices=SEARCH_TYPE_CHOICES)
    contraband_found = models.BooleanField()
    officer_id = models.CharField(max_length=15)
    driver_race = models.CharField(max_length=2, choices=RACE_CHOICES)
    driver_ethnicity = models.CharField(max_length=2, choices=ETHNICITY_CHOICES)
    driver_race_comb = models.CharField(max_length=2, choices=DriverRace.choices)
    count = models.IntegerField()

    class Meta:
        managed = False
        indexes = [
            models.Index(fields=["agency", "officer_id", "search_type"]),
            models.Index(fields=["agency", "date"]),
            models.Index(fields=["engage_force"]),
            models.Index(fields=["contraband_found"]),
        ]


CONTRABAND_SUMMARY_VIEW_SQL = f"""
    WITH
        contraband_groups AS (
            SELECT
                *
                , (CASE WHEN nc_contraband.pints > 0 OR nc_contraband.gallons > 0 THEN true
                        ELSE false
                   END) AS alcohol_found
                , (CASE WHEN nc_contraband.ounces > 0 OR nc_contraband.pounds > 0 OR nc_contraband.dosages > 0 OR nc_contraband.grams > 0 OR nc_contraband.kilos > 0 THEN true
                        ELSE false
                   END) AS drugs_found
                , (CASE WHEN nc_contraband.money > 0 THEN true
                        ELSE false
                   END) AS money_found
                , (CASE WHEN nc_contraband.dollar_amount > 0 THEN true
                        ELSE false
                   END) AS other_found
                , (CASE WHEN nc_contraband.weapons > 0 THEN true
                        ELSE false
                   END) AS weapons_found
            FROM nc_contraband
        ),
        contraband_types_without_id AS (
            SELECT
                contraband_id
                , person_id
                , search_id
                , stop_id
                , unnest(ARRAY['Alcohol', 'Drugs', 'Money', 'Other', 'Weapons']) AS contraband_type
                , unnest(ARRAY[alcohol_found, drugs_found, money_found, other_found, weapons_found]) AS contraband_found
            FROM contraband_groups
        ),
        contraband_types AS (
            SELECT
                ROW_NUMBER() OVER () AS contraband_type_id
                , *
            FROM contraband_types_without_id
        )
    SELECT
        contraband_type_id
        , nc_stop.stop_id
        , date AT TIME ZONE 'America/New_York' AS stop_date
        , nc_stop.agency_id
        , nc_stop.officer_id
        , (CASE WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.safety_violation_purposes()))}) THEN 'Safety Violation'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.other_purposes()))}) THEN 'Other'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurposeGroup.regulatory_purposes()))}) THEN 'Regulatory and Equipment'
                ELSE 'Other'
            END) as stop_purpose_group
        , (CASE WHEN nc_person.ethnicity = 'H' THEN 'Hispanic'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'A' THEN 'Asian'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'B' THEN 'Black'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'I' THEN 'Native American'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'U' THEN 'Other'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'W' THEN 'White'
            END) as driver_race
        , (CASE WHEN nc_person.gender = 'M' THEN 'Male'
                WHEN nc_person.gender = 'F' THEN 'Female'
            END) as driver_gender
        , (nc_search.search_id IS NOT NULL) AS driver_searched
        , nc_search.search_id
        , contraband_found
        , contraband_id
        , contraband_type
    FROM "nc_stop"
    INNER JOIN "nc_person"
        ON ("nc_stop"."stop_id" = "nc_person"."stop_id" AND "nc_person"."type" = 'D')
    INNER JOIN "nc_search"
        ON ("nc_stop"."stop_id" = "nc_search"."stop_id")
    LEFT OUTER JOIN "contraband_types"
        ON ("nc_stop"."stop_id" = "contraband_types"."stop_id")
"""  # noqa


class ContrabandSummary(CachingMixin, pg.ReadOnlyMaterializedView):
    sql = CONTRABAND_SUMMARY_VIEW_SQL
    # Don't create view with data, this will be manually managed
    # and refreshed by the data import process
    # https://github.com/mikicz/django-pgviews#with-no-data
    with_data = False

    id = models.PositiveIntegerField(primary_key=True, db_column="contraband_type_id")
    stop = models.ForeignKey("Stop", on_delete=models.DO_NOTHING)
    date = models.DateField(db_column="stop_date")
    agency = models.ForeignKey("Agency", on_delete=models.DO_NOTHING)
    officer_id = models.CharField(max_length=15)
    stop_purpose_group = models.CharField(choices=StopPurposeGroup.choices, max_length=32)
    driver_race_comb = models.CharField(
        max_length=2, choices=DriverRace.choices, db_column="driver_race"
    )
    driver_gender = models.CharField(max_length=8, choices=GENDER_CHOICES)
    driver_searched = models.BooleanField()
    search = models.ForeignKey("Search", on_delete=models.DO_NOTHING)
    contraband_found = models.BooleanField()
    contraband = models.ForeignKey("Contraband", on_delete=models.DO_NOTHING)
    contraband_type = models.CharField(max_length=16)

    class Meta:
        managed = False
        indexes = [
            models.Index(fields=["agency", "stop_purpose_group", "date"]),
            models.Index(fields=["agency", "date"]),
        ]


class Resource(models.Model):
    created_date = models.DateTimeField(auto_now_add=True, editable=False)
    publication_date = models.DateField(null=True, blank=True, editable=True)
    RESOURCE_IMAGES = [
        ("copwatch-new-policy", "New Policy"),
        ("forward-justice-logo", "Forward Justice Logo"),
        ("copwatch-white-paper", "White Paper"),
    ]
    agencies = models.ManyToManyField("Agency", related_name="resources")
    title = models.CharField(max_length=500, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    image = models.CharField(null=True, blank=True, choices=RESOURCE_IMAGES, max_length=200)
    view_more_link = models.URLField(null=True, blank=True)

    class Meta:
        ordering = ("-created_date",)

    def __str__(self):
        return format_html(self.title)


class ResourceFile(models.Model):
    created_date = models.DateTimeField(auto_now_add=True, editable=False)
    name = models.CharField(max_length=200, null=False, blank=False)
    file = models.FileField(upload_to="resource/")
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)

    def __str__(self):
        if self.file:
            return f"{self.file.name} for {self.resource.title}"
        return f"Resource file for {self.resource.title}"
