American Community Survey 5-Year Data API
=========================================

Downloading ACS data via the Census API is outlined here.

Setup
-----

1. Find the **Census API Key** entry in LastPass and add it to `.env`::

    CENSUS_API_KEY=***

2. Download the data::

    python manage.py import_census --use-api --output > acs-2018.json

3. Upload to the S3 bucket:

    aws s3 cp acs-2018.json s3://nccopwatch/
