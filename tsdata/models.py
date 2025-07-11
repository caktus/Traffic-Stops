from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

STATE_CHOICES = ((settings.NC_KEY, "North Carolina"),)

STATUS_CHOICES = (
    ("running", "Running"),
    ("error", "Error"),
    ("finished", "Finished"),
)

GEOGRAPHY_CHOICES = (
    ("county", "County"),
    ("place", "Place"),
    ("state", "State"),
)


class Dataset(models.Model):
    state = models.CharField(choices=STATE_CHOICES, max_length=2)
    name = models.CharField(max_length=255, unique=True)
    date_added = models.DateTimeField(auto_now_add=True)
    date_received = models.DateField()
    url = models.URLField("URL", unique=True)
    destination = models.CharField(
        blank=True,
        max_length=1024,
        help_text="Absolute path to destination directory (helpful for testing)",
    )  # noqa
    report_email_1 = models.EmailField(blank=True)
    report_email_2 = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.get_state_display()}: {self.name}"

    @property
    def agency_model(self):
        """Return the appropriate Agency model for this Dataset's state."""
        from nc.models import Agency as NCAgency

        agencies = {
            settings.NC_KEY: NCAgency,
        }

        return agencies.get(self.state)


class Import(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    date_started = models.DateTimeField(auto_now_add=True)
    date_finished = models.DateTimeField(null=True)
    successful = models.BooleanField(default=False)

    def __str__(self):
        return f"Import of {self.dataset}"


class CensusProfile(models.Model):
    id = models.AutoField(primary_key=True)
    acs_id = models.CharField(max_length=16)
    location = models.CharField(max_length=255)
    geography = models.CharField(max_length=16, choices=GEOGRAPHY_CHOICES)
    state = models.CharField(max_length=2)
    source = models.CharField(max_length=255)
    year = models.PositiveSmallIntegerField(default=2018)
    white = models.PositiveIntegerField(default=0)
    black = models.PositiveIntegerField(default=0)
    native_american = models.PositiveIntegerField(default=0)
    asian = models.PositiveIntegerField(default=0)
    native_hawaiian = models.PositiveIntegerField(default=0)
    other = models.PositiveIntegerField(default=0)
    two_or_more_races = models.PositiveIntegerField(default=0)
    hispanic = models.PositiveIntegerField(default=0)
    non_hispanic = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.location

    def get_census_dict(self):
        return dict(
            white=self.white,
            black=self.black,
            native_american=self.native_american,
            asian=self.asian,
            other=self.other + self.native_hawaiian + self.two_or_more_races,
            hispanic=self.hispanic,
            non_hispanic=self.non_hispanic,
            total=self.total,
            year=self.year,
        )


class StateFacts(models.Model):
    state_key = models.CharField(choices=STATE_CHOICES, max_length=2, unique=True)
    total_stops = models.PositiveIntegerField(default=0)
    total_stops_millions = models.PositiveIntegerField(default=0)
    total_searches = models.PositiveIntegerField(default=0)
    total_agencies = models.PositiveIntegerField(default=0)
    start_date = models.CharField(max_length=20, default="")
    end_date = models.CharField(max_length=20, default="")

    def __str__(self):
        return f"Facts for state {self.state_key}"

    class Meta:
        verbose_name_plural = "state facts"


class TopAgencyFacts(models.Model):
    state_facts = models.ForeignKey(StateFacts, on_delete=models.CASCADE)
    rank = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    agency_id = models.PositiveIntegerField(default=0)
    stops = models.PositiveIntegerField(default=0)
    name = models.CharField(max_length=255, default="")

    def __str__(self):
        return f"Facts for state {self.state_facts.state_key} agency {self.name}"

    class Meta:
        unique_together = (("state_facts", "rank"),)
        verbose_name_plural = "top agency facts"
        ordering = ["state_facts__state_key", "rank"]
