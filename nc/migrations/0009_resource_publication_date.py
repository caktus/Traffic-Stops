# Generated by Django 3.2.14 on 2023-03-09 16:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nc', '0008_auto_20230228_1121'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='publication_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]