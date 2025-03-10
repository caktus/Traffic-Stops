# Generated by Django 2.2.17 on 2021-11-13 15:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nc', '0004_agency_last_reported_stop'),
    ]

    operations = [
        migrations.CreateModel(
            name='StopSummary',
            fields=[
                ('id', models.PositiveIntegerField(primary_key=True, serialize=False)),
                ('year', models.IntegerField()),
                ('stop_purpose', models.PositiveSmallIntegerField(choices=[(1, 'Speed Limit Violation'), (2, 'Stop Light/Sign Violation'), (3, 'Driving While Impaired'), (4, 'Safe Movement Violation'), (5, 'Vehicle Equipment Violation'), (6, 'Vehicle Regulatory Violation'), (7, 'Seat Belt Violation'), (8, 'Investigation'), (9, 'Other Motor Vehicle Violation'), (10, 'Checkpoint')])),
                ('engage_force', models.BooleanField()),
                ('search_type', models.PositiveSmallIntegerField(choices=[(1, 'Consent'), (2, 'Search Warrant'), (3, 'Probable Cause'), (4, 'Search Incident to Arrest'), (5, 'Protective Frisk')])),
                ('contraband_found', models.BooleanField()),
                ('officer_id', models.CharField(max_length=15)),
                ('driver_race', models.CharField(choices=[('A', 'Asian'), ('B', 'Black'), ('I', 'Native American'), ('U', 'Other'), ('W', 'White')], max_length=2)),
                ('driver_ethnicity', models.CharField(choices=[('H', 'Hispanic'), ('N', 'Non-Hispanic')], max_length=2)),
                ('count', models.IntegerField()),
            ],
            options={
                'managed': False,
            },
        ),
    ]
