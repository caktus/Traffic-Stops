# Generated by Django 2.2.15 on 2020-09-28 17:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nc', '0003_auto_20180115_1141'),
    ]

    operations = [
        migrations.AddField(
            model_name='agency',
            name='last_reported_stop',
            field=models.DateField(null=True),
        ),
    ]
