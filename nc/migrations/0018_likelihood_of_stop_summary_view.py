import django_pgviews.db.migrations.operations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("nc", "0017_auto_20260127_1539"),
    ]

    operations = [
        migrations.CreateModel(
            name="LikelihoodOfStopSummary",
            fields=[
                ("id", models.BigIntegerField(primary_key=True, serialize=False)),
                ("level", models.CharField(max_length=16)),
                ("group_id", models.CharField(max_length=16)),
                ("group_name", models.CharField(max_length=255)),
                ("census_profile_id", models.CharField(max_length=32)),
                ("year", models.IntegerField()),
                ("driver_race", models.CharField(max_length=20)),
                ("population", models.IntegerField()),
                ("total_population", models.IntegerField()),
                ("stops", models.BigIntegerField()),
                ("stop_rate", models.FloatField()),
                ("baseline_rate", models.FloatField()),
                ("stop_rate_ratio", models.FloatField()),
                ("times_likely", models.FloatField()),
            ],
            options={
                "managed": False,
            },
        ),
        django_pgviews.db.migrations.operations.RegisterViewOperation(
            name="LikelihoodOfStopSummary",
            materialized=False,
            db_name="nc_likelihoodofstopsummary",
        ),
    ]
