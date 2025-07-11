import logging
import os
import subprocess
import tempfile
import time
import zipfile

from collections import OrderedDict

import requests

logger = logging.getLogger(__name__)


def call(cmd, shell=False):
    """Spawn a new process and capture its output"""
    logger.debug(" ".join(cmd))
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=shell)
    stdout, stderr = p.communicate()
    if p.returncode != 0:
        raise OSError(stderr)
    if stderr:
        logger.error(stderr.decode("utf-8"))
    return stdout


def line_count(fname):
    """Count number of lines in specified file"""
    return int(call(["wc", "-l", fname]).strip().split()[0])


def get_zipfile_path(url, destination):
    """
    Get full path of the zipfile as if it has been downloaded to destination.
    """
    return os.path.join(destination, url.split("/")[-1])


def get_datafile_path(url, destination, zip_path=None):
    """
    Get full path of the datafile within the downloaded zip.
    Assumptions:
    1. zip has already been downloaded to destination.
    2. the first file in the zip is the datafile
    Datafile may not have been extracted yet.
    """
    if bool(url) == bool(zip_path):
        raise ValueError("Exactly one of url and zip_path parameters must be provided!")

    if not zip_path:
        zip_path = get_zipfile_path(url, destination)
    archive = zipfile.ZipFile(zip_path)
    return os.path.join(destination, archive.infolist()[0].filename)


def get_csv_path(url, destination):
    """
    Get full path of the CSV form of the datafile in the downloaded zip.
    This is the processed CSV, which would be different than the raw
    data.
    Assumptions: See assumptions of get_datafile_path()
    """
    datafile_path = get_datafile_path(url, destination)
    return os.path.splitext(datafile_path)[0] + "-processed.csv"


def unzip_data(destination, url=None, zip_path=None):
    if not destination:
        raise ValueError("The destination parameter is required!")

    if bool(url) == bool(zip_path):
        raise ValueError("Exactly one of url and zip_path parameters must be provided!")

    if not zip_path:
        zip_path = get_zipfile_path(url, destination)

    first_file_in_zip = get_datafile_path(None, destination, zip_path=zip_path)
    if os.path.exists(first_file_in_zip):
        logger.debug(f"{first_file_in_zip} exists, skipping extract")
    else:
        archive = zipfile.ZipFile(zip_path)
        logger.debug(f"Extracting archive into {destination}")
        archive.extractall(path=destination)
        logger.debug("Extraction complete")


def download_and_unzip_data(url, destination, prefix="state-"):
    """Download and unzip data into destination directory"""
    # make sure destination exists or create a temporary directory
    if not destination:
        destination = tempfile.mkdtemp(prefix=prefix)
        logger.debug(f"Created temp directory {destination}")
    else:
        if not os.path.exists(destination):
            os.makedirs(destination)
            logger.info(f"Created {destination}")
    zip_filename = get_zipfile_path(url, destination)
    # don't re-download data if raw data file already exists
    if os.path.exists(zip_filename):
        logger.debug(f"{zip_filename} exists, skipping download")
    else:
        logger.debug(f"Downloading data to {zip_filename}")
        response = requests.get(url, stream=True)
        # XXX check status code here; e.g., if permissions haven't been granted
        # for a file being downloaded from S3 a 403 will be returned
        content_length = int(response.headers.get("content-length"))
        start = time.clock()
        downloaded = 0
        with open(zip_filename, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    downloaded += len(chunk)
                    now = time.clock()
                    if (now - start) >= 5:
                        logger.debug(f"{downloaded / content_length * 100:.2g}% downloaded")
                        start = now
                    f.write(chunk)
                    f.flush()
        logger.debug("100% downloaded")

    unzip_data(destination, url=url)
    return destination


class GroupedData:
    """Data structure to build and flatten nested dictionaries"""

    def __init__(self, by, defaults=None):
        if type(by) is str:
            by = tuple([by])
        self.group_by = by
        self.data = OrderedDict()
        self.defaults = defaults or {}

    def add(self, **kwargs):
        """Save (group, value) mapping to internal dict"""
        group = []
        for name in self.group_by:
            group.append(kwargs.pop(name))
        group = tuple(group)
        if group not in self.data:
            self.data[group] = OrderedDict(self.defaults.copy())

        for key in set(kwargs) - set(self.group_by):
            self.data[group][key] = self.data[group].get(key, 0) + kwargs.get(key, 0)

    def flatten(self):
        """Transform (group, value) mapping into list of dicts"""
        response = []
        for group, data in self.data.items():
            group_by = zip(self.group_by, group)
            row = OrderedDict(group_by)
            row.update(data)
            response.append(row)
        return response
