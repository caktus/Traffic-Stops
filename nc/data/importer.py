import csv
import glob
import logging
import os
import re
import sys

from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import connections, transaction

from nc.data import copy_nc
from nc.models import Agency, ContrabandSummary, Search, Stop, StopSummary
from tsdata.dataset_facts import compute_dataset_facts
from tsdata.sql import drop_constraints_and_indexes
from tsdata.utils import call, download_and_unzip_data, line_count, unzip_data

from .download_from_nc import nc_download_and_unzip_data

logger = logging.getLogger(__name__)

MAGIC_NC_FTP_URL = "ftp://nc.us/"


def run(url, destination=None, zip_path=None, min_stop_id=None, max_stop_id=None, prime_cache=True):
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
        raise ValueError("destination must be provided when no URL is provided")

    if (min_stop_id is None) != (max_stop_id is None):
        raise ValueError("provide neither or both of min_stop_id and max_stop_id")

    if max_stop_id is not None and min_stop_id > max_stop_id:
        raise ValueError("min_stop_id cannot be larger than max_stop_id")

    logger.info("*** NC Data Import Started ***")

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
        override_start_date = "Jan 01, 2002"

    # convert data files to CSV for database importing
    logger.info("Converting to CSV")
    convert_to_csv(destination)

    # find any new NC agencies and add to a copy of NC_agencies.csv
    logger.info("Looking for new NC agencies in Stops.csv")
    nc_agency_csv = update_nc_agencies(
        os.path.join(os.path.dirname(__file__), "NC_agencies.csv"), destination
    )

    # use COPY to load CSV files as quickly as possible
    copy_from(destination, nc_agency_csv)
    logger.info("NC Data Import Complete")

    # fix landing page data
    facts = compute_dataset_facts(
        Agency, Stop, settings.NC_KEY, Search=Search, override_start_date=override_start_date
    )
    logger.info("NC dataset facts: %r", facts)

    # update materialized view
    logger.info("Updating materialized views")
    StopSummary.refresh()
    ContrabandSummary.refresh()
    logger.info("Materialized views updated")

    # prime the query cache for large NC agencies
    if prime_cache:
        from nc.tasks import prime_all_endpoints

        prime_all_endpoints.delay(
            clear_cache=True,
            skip_agencies=False,
            skip_officers=True,
        )


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
    logger.info("Filtering out stops with id not in (%s, %s)", min_stop_id, max_stop_id)
    data_file_description = (
        ("Stop.txt", 0),
        ("PERSON.txt", 1),
        ("Search.txt", 1),
        ("Contraband.txt", 3),
        ("SearchBasis.txt", 3),
    )
    for in_basename, stops_field_num in data_file_description:
        data_in_path = os.path.join(destination, in_basename)
        data_out_path = data_in_path + ".new"
        with open(data_in_path, "rb") as data_in:
            with open(data_out_path, "wb") as data_out:
                for line in data_in:
                    fields = line.split(b"\t")
                    stop_id = int(fields[stops_field_num])
                    if min_stop_id <= stop_id <= max_stop_id:
                        data_out.write(line)
        os.replace(data_out_path, data_in_path)


def to_standard_csv(input_path, output_path):
    csv.register_dialect(
        "nc_data_in",
        delimiter="\t",
        doublequote=False,
        escapechar=None,
        lineterminator="\r\n",
        quotechar='"',
        quoting=csv.QUOTE_MINIMAL,
        skipinitialspace=False,
    )
    csv.register_dialect(
        "nc_data_out",
        delimiter=",",
        doublequote=False,
        escapechar=None,
        lineterminator="\n",
        quotechar='"',
        quoting=csv.QUOTE_MINIMAL,
        skipinitialspace=False,
    )
    with open(input_path) as input:
        with open(output_path, "w") as output:
            reader = csv.reader(input, dialect="nc_data_in")
            writer = csv.writer(output, dialect="nc_data_out")
            headings_written = False
            num_columns = sys.maxsize  # keep all of first row, however many
            for row in reader:
                columns = [column.strip() for i, column in enumerate(row) if i < num_columns]
                if not headings_written:
                    # Some records in Stops.csv have extra columns; drop any
                    # columns beyond those in the first record.
                    num_columns = len(columns)
                    headings = ["column%d" % (i + 1) for i in range(len(columns))]
                    writer.writerow(headings)
                    headings_written = True
                writer.writerow(columns)


def convert_to_csv(destination):
    """Convert each NC *.txt data file to CSV"""
    FILES_TO_SKIP = r"(QUERY_README\.txt|^.*_format\.txt)"
    files = glob.iglob(os.path.join(destination, "*.txt"))
    for data_path in files:
        if re.match(FILES_TO_SKIP, os.path.basename(data_path)):
            continue
        csv_path = data_path.replace(".txt", ".csv")
        if os.path.exists(csv_path):
            logger.info(f"{csv_path} already exists, skipping csv conversion")
            continue
        logger.info(f"Converting {data_path} > {csv_path}")
        # Edit source data .txt file in-place to remove NUL bytes
        # (only seen in Stop.txt)
        call([rf"sed -i 's/\x0//g' {data_path}"], shell=True)
        to_standard_csv(data_path, csv_path)
        data_count = line_count(data_path)
        csv_count = line_count(csv_path)
        if data_count == (csv_count - 1):
            logger.debug(f"CSV line count matches original data file: {data_count}")
        else:
            logger.error(f"DAT {data_count}")
            logger.error(f"CSV {csv_count}")


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

    with open(os.path.join(destination, "Stop.csv")) as stop_file:
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
        logger.info("No new agencies in latest NC data, using table %s", nc_csv_path)
        return nc_csv_path

    # Build an updated table to use for the import and send an e-mail to
    # admins.
    extra_agencies = sorted(current_agencies - existing_agencies)
    last_agency_id = int(agency_table_contents[-1][0])
    for agency_name in extra_agencies:
        last_agency_id += 1
        agency_table_contents.append([last_agency_id, agency_name, ""])

    new_nc_csv_path = os.path.join(destination, "NC_agencies.csv")
    with open(new_nc_csv_path, "w") as agency_file:
        agency_table = csv.writer(agency_file)
        for agency_info in agency_table_contents:
            agency_table.writerow(agency_info)

    logger.info(
        "%s new agencies in latest NC data, using table %s", len(extra_agencies), new_nc_csv_path
    )

    email_body = """
        Here are the new agencies:\n
           %s\n
        A new agency table is attached.  You can add census codes for the
        the new agencies before checking in.
    """ % ", ".join(
        extra_agencies
    )
    email = EmailMessage(
        "New NC agencies were discovered during import",
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        settings.NC_AUTO_IMPORT_MONITORS,
        attachments=(
            (os.path.basename(new_nc_csv_path), open(new_nc_csv_path).read(), "application/csv"),
        ),
    )
    email.send()
    return new_nc_csv_path


def set_time_zone(cur, time_zone):
    logger.info(f"Set time zone to {time_zone}")
    cur.execute(connections["traffic_stops_nc"].ops.set_time_zone_sql(), [time_zone])


@transaction.atomic(using="traffic_stops_nc")
def copy_from(destination, nc_csv_path):
    """Populates the NC database from csv files."""

    with connections["traffic_stops_nc"].cursor() as cur:
        logger.info("Dropping NC constraints before import")
        drop_constraints_and_indexes(cur)
        set_time_zone(cur, settings.NC_TIME_ZONE)
        logger.info("Truncating tables")
        cur.execute(copy_nc.CLEAN_DATABASE)
        # agencies
        agency_path = Path(nc_csv_path)
        with agency_path.open() as fh:
            logger.info(f"COPY {nc_csv_path} into the database")
            cur.copy_expert(copy_nc.NC_AGENCY_COPY_INSTRUCTIONS, fh)
        # datasets
        path = Path(destination)
        for p in path.glob("*.csv"):
            if p.name in copy_nc.NC_COPY_INSTRUCTIONS.keys():
                with p.open() as fh:
                    logger.info(f"COPY {p.name} into the database")
                    cur.copy_expert(copy_nc.NC_COPY_INSTRUCTIONS[p.name], fh)
        logger.info("Finalizing import (this will take a LONG time...)")
        cur.execute(copy_nc.FINALIZE_COPY)
        logger.info("ANALYZE")
        cur.execute("ANALYZE")
        set_time_zone(cur, "UTC")
        logger.info("COMMIT")
