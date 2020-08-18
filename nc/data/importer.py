import csv
import datetime
import glob
import logging
import os
import sys
from pathlib import Path
import psycopg2

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import connections

import pytz

from tsdata.dataset_facts import compute_dataset_facts
from tsdata.sql import drop_constraints_and_indexes
from tsdata.utils import call, flush_memcached, line_count, download_and_unzip_data, unzip_data
from nc.models import Agency, Search, Person, Stop, Contraband, SearchBasis
from nc.prime_cache import run as prime_cache_run
from .download_from_nc import nc_download_and_unzip_data

logger = logging.getLogger(__name__)

MAGIC_NC_FTP_URL = 'ftp://nc.us/'


def run(url, destination=None, zip_path=None, min_stop_id=None,
        max_stop_id=None, prime_cache=True):
    """
    Download NC data, extract, convert to CSV, and load into PostgreSQL

    :param url: if not None, zip will be downloaded from this URL; this can
      either be a URL supported by the requests library OR the special URL
      MAGIC_NC_FTP_URL, in which case the zip will be downloaded from the state
      of North Carolina server.
    :param destination: directory for unpacking zip and creating other
      files; pass None to create a temporary file
    :param zip_path: path to previously-downloaded zip
    :param prime_cache: whether or not to prime the query cache for "big"
      NC agencies after import
    :param max_stop_id: only process stops with ids <= this value; this is to
      save time for developers by reducing the amount of data to import
    :param min_stop_id: only process stops with ids >= this value; this is to
      save time for developers by reducing the amount of data to import
    """
    if not url and not destination:
        raise ValueError('destination must be provided when no URL is provided')

    if (min_stop_id is None) != (max_stop_id is None):
        raise ValueError('provide neither or both of min_stop_id and max_stop_id')

    if max_stop_id is not None and min_stop_id > max_stop_id:
        raise ValueError('min_stop_id cannot be larger than max_stop_id')

    logger.info('*** NC Data Import Started ***')

    if url:
        if url == MAGIC_NC_FTP_URL:
            destination = nc_download_and_unzip_data(destination)
        else:
            destination = download_and_unzip_data(url, destination)
    else:
        unzip_data(destination, zip_path=zip_path)

    if max_stop_id is not None:
        truncate_input_data(destination, min_stop_id, max_stop_id)
        override_start_date = None
    else:
        # When processing entire dataset, pretend we don't have data from
        # 2000-2001 since so few agencies reported then.
        override_start_date = 'Jan 01, 2002'

    # convert data files to CSV for database importing
    convert_to_csv(destination)

    # find any new NC agencies and add to a copy of NC_agencies.csv
    nc_agency_csv = update_nc_agencies(
        os.path.join(os.path.dirname(__file__), 'NC_agencies.csv'),
        destination
    )

    # drop constraints/indexes
    drop_constraints_and_indexes(connections['traffic_stops_nc'].cursor())
    # use COPY to load CSV files as quickly as possible
    copy_from(destination, nc_agency_csv)
    logger.info("NC Data Import Complete")

    # Clear the query cache to get rid of NC queries made on old data
    flush_memcached()

    # fix landing page data
    facts = compute_dataset_facts(
        Agency, Stop, settings.NC_KEY, Search=Search,
        override_start_date=override_start_date
    )
    logger.info('NC dataset facts: %r', facts)

    # prime the query cache for large NC agencies
    if prime_cache:
        prime_cache_run()


def truncate_input_data(destination, min_stop_id, max_stop_id):
    """
    For faster development, filter Stops.txt to include stops only in a certain
    range, then adjust the data for Person, Search, Contraband, and SearchBasis
    accordingly.  By limiting the size of the input data, most phases of the
    import flow will be much faster.

    :param destination: directory path which contains NC data files
    :param min_stop_id: omit stops with lower id
    :param max_stop_id: point in the Stops data at which to truncate
    """
    logger.info('Filtering out stops with id not in (%s, %s)', min_stop_id, max_stop_id)
    data_file_description = (
        ('Stop.txt', 0),
        ('PERSON.txt', 1),
        ('Search.txt', 1),
        ('Contraband.txt', 3),
        ('SearchBasis.txt', 3),
    )
    for in_basename, stops_field_num in data_file_description:
        data_in_path = os.path.join(destination, in_basename)
        data_out_path = data_in_path + '.new'
        with open(data_in_path, 'rb') as data_in:
            with open(data_out_path, 'wb') as data_out:
                for line in data_in:
                    fields = line.split(b'\t')
                    stop_id = int(fields[stops_field_num])
                    if min_stop_id <= stop_id <= max_stop_id:
                        data_out.write(line)
        os.replace(data_out_path, data_in_path)


def to_standard_csv(input_path, output_path):
    csv.register_dialect(
        'nc_data_in',
        delimiter='\t',
        doublequote=False,
        escapechar=None,
        lineterminator='\r\n',
        quotechar='"',
        quoting=csv.QUOTE_MINIMAL,
        skipinitialspace=False,
    )
    csv.register_dialect(
        'nc_data_out',
        delimiter=',',
        doublequote=False,
        escapechar=None,
        lineterminator='\n',
        quotechar='"',
        quoting=csv.QUOTE_MINIMAL,
        skipinitialspace=False,
    )
    with open(input_path, 'rt') as input:
        with open(output_path, 'wt') as output:
            reader = csv.reader(input, dialect='nc_data_in')
            writer = csv.writer(output, dialect='nc_data_out')
            headings_written = False
            num_columns = sys.maxsize  # keep all of first row, however many
            for row in reader:
                columns = [column.strip() for i, column in enumerate(row) if i < num_columns]
                if not headings_written:
                    # Some records in Stops.csv have extra columns; drop any
                    # columns beyond those in the first record.
                    num_columns = len(columns)
                    headings = ['column%d' % (i + 1) for i in range(len(columns))]
                    writer.writerow(headings)
                    headings_written = True
                writer.writerow(columns)


def convert_to_csv(destination):
    """Convert each NC *.txt data file to CSV"""
    files = glob.iglob(os.path.join(destination, '*.txt'))
    for data_path in files:
        if os.path.basename(data_path) == 'QUERY_README.txt':  # list of years in the query
            continue
        csv_path = data_path.replace('.txt', '.csv')
        if os.path.exists(csv_path):
            logger.info('{} already exists, skipping csv conversion'.format(csv_path))
            continue
        logger.info("Converting {} > {}".format(data_path, csv_path))
        # Edit source data .txt file in-place to remove NUL bytes
        # (only seen in Stop.txt)
        call([r"sed -i 's/\x0//g' {}".format(data_path)], shell=True)
        to_standard_csv(data_path, csv_path)
        data_count = line_count(data_path)
        csv_count = line_count(csv_path)
        if data_count == (csv_count - 1):
            logger.debug('CSV line count matches original data file: {}'.format(data_count))
        else:
            logger.error('DAT {}'.format(data_count))
            logger.error('CSV {}'.format(csv_count))


def update_nc_agencies(nc_csv_path, destination):
    """
    Agency ids need to be stable in order to have stable agency URLs.
    See if the new Stop file has any additional agencies beyond what is
    in our NC agencies table in the source code.  If so, build a new
    agency table with ids assigned for the new agencies and send an
    e-mail to admins to update the table; import will use the temporary
    agency table.  If there are no additional agencies, import will use the
    existing agency table.

    Ids of agencies not in the permanent agency table are subject to change
    until a developer adds the agency to the table in the source code.
    """

    with open(os.path.join(destination, 'Stop.csv')) as stop_file:
        stops = csv.reader(stop_file)
        next(stops)  # skip CSV header line
        current_agencies = set()
        for row in stops:
            current_agencies.add(row[1])

    with open(nc_csv_path) as agency_file:
        agency_table = csv.reader(agency_file)
        agency_table_contents = list()
        agency_table_contents.append(next(agency_table))
        existing_agencies = set()
        for row in agency_table:
            existing_agencies.add(row[1])
            agency_table_contents.append(row)

    if current_agencies.issubset(existing_agencies):
        logger.info('No new agencies in latest NC data, using table %s',
                    nc_csv_path)
        return nc_csv_path

    # Build an updated table to use for the import and send an e-mail to
    # admins.
    extra_agencies = sorted(current_agencies - existing_agencies)
    last_agency_id = int(agency_table_contents[-1][0])
    for agency_name in extra_agencies:
        last_agency_id += 1
        agency_table_contents.append([last_agency_id, agency_name, ''])

    new_nc_csv_path = os.path.join(destination, 'NC_agencies.csv')
    with open(new_nc_csv_path, 'w') as agency_file:
        agency_table = csv.writer(agency_file)
        for agency_info in agency_table_contents:
            agency_table.writerow(agency_info)

    logger.info('%s new agencies in latest NC data, using table %s',
                len(extra_agencies), new_nc_csv_path)

    email_body = """
        Here are the new agencies:\n
           %s\n
        A new agency table is attached.  You can add census codes for the
        the new agencies before checking in.
    """ % ', '.join(extra_agencies)
    email = EmailMessage(
        'New NC agencies were discovered during import',
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        settings.NC_AUTO_IMPORT_MONITORS,
        attachments=(
            (
                os.path.basename(new_nc_csv_path),
                open(new_nc_csv_path).read(),
                'application/csv'
            ),
        )
    )
    email.send()
    return new_nc_csv_path

def copy_from(destination, nc_csv_path):
    """Execute copy.sql to COPY csv data files into PostgreSQL database"""
    SET_TIMEZONE = f"SET TIMEZONE='{settings.NC_TIME_ZONE}'"
    CLEAN_DATABASE = """
        TRUNCATE "nc_stop" RESTART IDENTITY CASCADE;
        TRUNCATE "nc_person" RESTART IDENTITY CASCADE;
        TRUNCATE "nc_search" RESTART IDENTITY CASCADE;
        TRUNCATE "nc_searchbasis" RESTART IDENTITY CASCADE;
        TRUNCATE "nc_contraband" RESTART IDENTITY CASCADE;
        TRUNCATE "nc_agency" RESTART IDENTITY CASCADE;
    """
    NC_SQL_COPY = {
        "Stop.csv": "COPY nc_stop (stop_id, agency_description, date, purpose, action, driver_arrest, passenger_arrest, encounter_force, engage_force, officer_injury, driver_injury, passenger_injury, officer_id, stop_location, stop_city) FROM STDIN WITH  DELIMITER ',' NULL AS '' CSV HEADER FORCE NOT NULL officer_id, stop_city, stop_location",
        "PERSON.csv": "COPY nc_person (person_id, stop_id, type, age, gender, ethnicity, race) FROM STDIN WITH DELIMITER ',' NULL AS '' CSV HEADER FORCE NOT NULL ethnicity, gender, race",
        "Search.csv": "COPY nc_search (search_id, stop_id, person_id, type, vehicle_search, driver_search, passenger_search, property_search, vehicle_siezed, personal_property_siezed, other_property_sized) FROM STDIN WITH DELIMITER ',' NULL AS '' CSV HEADER",
        "Contraband.csv": "COPY nc_contraband (contraband_id, search_id, person_id, stop_id, ounces, pounds, pints, gallons, dosages, grams, kilos, money, weapons, dollar_amount) FROM STDIN WITH DELIMITER ',' CSV HEADER",
        "SearchBasis.csv": "COPY nc_searchbasis (search_basis_id, search_id, person_id, stop_id, basis) FROM STDIN WITH DELIMITER ',' CSV HEADER",
        "NC_agencies.csv": "COPY  nc_agency (id, name, census_profile_id) FROM STDIN WITH DELIMITER ',' CSV HEADER FORCE NOT NULL census_profile_id"
    }

    FINALIZE_COPY = """
        UPDATE nc_stop SET agency_id = nc_agency.id FROM nc_agency WHERE nc_stop.agency_description = nc_agency.name;

        ANALYZE;

        ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_pkey" PRIMARY KEY (stop_id);
        ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasis_pkey" PRIMARY KEY (search_basis_id);
        ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_pkey" PRIMARY KEY (search_id);
        ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_pkey" PRIMARY KEY (person_id);
        ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_pkey" PRIMARY KEY (contraband_id);
        ALTER TABLE "public"."nc_agency" ADD CONSTRAINT "nc_agency_pkey" PRIMARY KEY (id);
        ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_stop_id_check" CHECK ((stop_id >= 0));
        ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_purpose_check" CHECK ((purpose >= 0));
        ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_action_check" CHECK ((action >= 0));
        ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_type_check" CHECK ((type >= 0));
        ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_age_check" CHECK ((age >= 0));
        ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_agency_id_f050f703620f44c_fk_nc_agency_id" FOREIGN KEY (agency_id) REFERENCES nc_agency(id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasis_stop_id_36f52da3736812d4_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasi_search_id_3e2dcf5dc9fc212f_fk_nc_search_search_id" FOREIGN KEY (search_id) REFERENCES nc_search(search_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasi_person_id_3500809179032efb_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_stop_id_631cf86a83f3528_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_person_id_13b611eaa9879eb9_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_stop_id_391c330ed82da305_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_stop_id_77ce6cabcbe40c3c_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_search_id_7ead089372beb55f_fk_nc_search_search_id" FOREIGN KEY (search_id) REFERENCES nc_search(search_id) DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_person_id_50e4f1b98b0285ab_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
        CREATE INDEX nc_contraband_5fad4402 ON nc_contraband USING btree (search_id);
        CREATE INDEX nc_contraband_91455da7 ON nc_contraband USING btree (stop_id);
        CREATE INDEX nc_contraband_a8452ca7 ON nc_contraband USING btree (person_id);
        CREATE INDEX nc_person_91455da7 ON nc_person USING btree (stop_id);
        CREATE INDEX nc_search_91455da7 ON nc_search USING btree (stop_id);
        CREATE INDEX nc_search_a8452ca7 ON nc_search USING btree (person_id);
        CREATE INDEX nc_searchbasis_5fad4402 ON nc_searchbasis USING btree (search_id);
        CREATE INDEX nc_searchbasis_91455da7 ON nc_searchbasis USING btree (stop_id);
        CREATE INDEX nc_searchbasis_a8452ca7 ON nc_searchbasis USING btree (person_id);
        CREATE INDEX nc_stop_169fc544 ON nc_stop USING btree (agency_id);
        CREATE INDEX nc_stop_date_7d643c8a9c590bf7_uniq ON nc_stop USING btree (date);

        ANALYZE;
        COMMIT;
    """
    conn = psycopg2.connect(database="traffic_stops_nc", user=os.environ.get("PGUSER"), host=os.environ.get("PGHOST"), port=os.environ.get("PGPORT"))
    with conn:
        with conn.cursor() as cur:
            cur.execute(SET_TIMEZONE)
            cur.execute(CLEAN_DATABASE)
            path = Path(destination)
            for p in path.glob("*.csv"):
                if p.name in NC_SQL_COPY.keys():
                    with p.open() as fh:
                        logger.info(f"INSERTING {p.name} into the database")
                        cur.copy_expert(NC_SQL_COPY[p.name], fh)
            cur.execute(FINALIZE_COPY)
            

    # Remove all stops and related objects that are before 1 Jan 2002, when everyone
    # started reporting consistently.  Don't clear out the NC State Highway Patrol
    # data, though, since they were reporting consistently before that.

    nc_tz = pytz.timezone(settings.NC_TIME_ZONE)
    begin_dt = nc_tz.localize(datetime.datetime(2002, 1, 1))
    agency = Agency.objects.get(name="NC State Highway Patrol")

    # Perform deletions of pre-2002 data in order by model dependencies, all tables
    # that have a foreign key reference to another must be done beforehand:
    #   SearchBasis (-> Search, Person, Stop),
    #   Contraband (-> Search, Person, Stop),
    #   Search (-> Person, Stop),
    #   Person (-> Stop),
    #   Stop
    SearchBasis.objects.exclude(stop__agency=agency).filter(stop__date__lt=begin_dt).delete()
    Contraband.objects.exclude(stop__agency=agency).filter(stop__date__lt=begin_dt).delete()
    Search.objects.exclude(stop__agency=agency).filter(stop__date__lt=begin_dt).delete()
    Person.objects.exclude(stop__agency=agency).filter(stop__date__lt=begin_dt).delete()
    Stop.objects.exclude(agency=agency).filter(date__lt=begin_dt).delete()
