import logging
import os
import ssl
import tempfile

from datetime import date
from ftplib import FTP_TLS

from django.conf import settings

from tsdata.utils import unzip_data

logger = logging.getLogger(__name__)


def show_ftp_listing(s):
    logger.debug(s)


def ftps_connect(host):
    ftps = FTP_TLS()
    ftps.ssl_version = ssl.PROTOCOL_SSLv23
    ftps.connect(host)
    ftps.login(settings.NC_FTP_USER, settings.NC_FTP_PASSWORD)
    ftps.prot_p()
    return ftps


def nc_download_and_unzip_data(destination, prefix="state-"):
    """Download and unzip data into destination directory"""
    # make sure destination exists or create a temporary directory
    if not destination:
        destination = tempfile.mkdtemp(prefix=prefix)
        logger.debug("Created temp directory {}".format(destination))
    else:
        if not os.path.exists(destination):
            os.makedirs(destination)
            logger.info("Created {}".format(destination))
    zip_basename = date.today().strftime("NC_STOPS_Extract_%Y_%m_%d.zip")
    zip_filename = os.path.join(destination, zip_basename)
    # don't re-download data if raw data file already exists
    if os.path.exists(zip_filename):
        logger.debug("{} exists, skipping download".format(zip_filename))
    else:
        logger.debug("Downloading data to {}".format(zip_filename))
        nc_data_site = settings.NC_FTP_HOST
        nc_data_file = "STOPS_Extract.zip"
        nc_data_directory = "/TSTOPextract"
        ftps = ftps_connect(nc_data_site)
        ftps.cwd(nc_data_directory)
        logger.debug("Files available at %s:", nc_data_site)
        listing = ftps.retrlines("LIST", show_ftp_listing)
        line = listing.split("\n")[0]
        if not line.startswith("226 "):  # server's "Transfer complete" message
            raise ValueError("Expected 226 response from ftp server, got %r" % listing)
        logger.info('Downloading "%s"...', nc_data_file)
        with open(zip_filename, "wb") as f:
            ftps.retrbinary("RETR %s" % nc_data_file, f.write)
        logger.info('File written to "%s"' % zip_filename)

    unzip_data(destination, zip_path=zip_filename)
    return destination
