Data Import
===========

Census data for all states is imported all at once, in the same manner for all
environments, using the ``import_census`` management command.  This must be
performed as part of developer and server setup as well as when census support is
added for additional states.


Local/Development Environment
-----------------------------

Before running state imports, first import census data:

.. code-block:: bash

  python manage.py import_census


Database Dump (quicker)
_______________________

To load an existing database dump on S3, run:

.. code-block:: bash

    dropdb traffic_stops_nc && createdb -E UTF-8 traffic_stops_nc
    aws s3 cp s3://forwardjustice-trafficstops/traffic_stops_nc-20250204.dump .
    pg_restore -Ox -d traffic_stops_nc traffic_stops_nc-20250204.dump


Raw NC Data (slower)
____________________

The state-specific database must exist and current migrations need to have been
applied before importing.  If in doubt:

.. code-block:: bash

    # for NC
    dropdb traffic_stops_nc && createdb -E UTF-8 traffic_stops_nc

    ./migrate_all_dbs.sh


Command-line
++++++++++++

If loading NC, make sure to add ``NC_FTP_USER``, ``NC_FTP_PASSWORD``, and
``NC_FTP_HOST`` to your ``.env`` file.

If on a Mac, install ``gnu-sed``:

.. code-block:: bash

  brew install gnu-sed --with-default-names

Run the import command:

.. code-block:: bash

    # for NC (~25m)
    rm -rf ./ncdata  # if you don't want to reuse previous download
    python manage.py import_nc --dest $PWD/ncdata --noprime  # noprime = don't prime cache

This took ~25 minutes on my laptop. Run ``tail -f traffic_stops.log`` to follow
along.  Reusing an existing ``--dest`` directory will speed up import.  However,
if import code has changed since the last time the directory was used, don't
reuse an existing directory.

Now you should be able to view data with ``runserver``:

.. code-block:: bash

    python manage.py runserver


Admin
+++++

Access /admin/tsdata/dataset/ and create a "dataset" describing the data to be
imported.  Setting the fields:

- Select the desired state
- Provide a unique name for the dataset
- The date received should reflect when the raw data was received
- Set the URL to one of the available datasets at
  https://s3-us-west-2.amazonaws.com/openpolicingdata/ .  The normal URLs
  are stored in the source code (in ``<state_app>.data.__init__.py``).
  For NC, if you use the magic URL ``ftp://nc.us/``, the latest available
  dataset will be downloaded from the state and used for this import.
- Specify a destination directory where the dataset will be downloaded and
  extracted.
- Optionally specify one or two e-mail addresses that will be notified when
  the import completes successfully.

Once the "dataset" has been created, select the new dataset in list view and
apply the "Import selected dataset" action.


Server
------

The PostgreSQL user must have SUPERUSER privileges to perform the import.
Depending on current admin policies, that may have to be granted and
revoked around the import.

Temporarily grant our PostgreSQL user SUPERUSER privileges:

.. code-block:: bash

    sudo -u postgres psql -c 'ALTER USER traffic_stops_staging WITH SUPERUSER;'

When finished, revoke SUPERUSER privileges:

.. code-block:: bash

    sudo -u postgres psql -c 'ALTER USER traffic_stops_staging WITH NOSUPERUSER;'

When importing IL data on a server, paging space is required due to the memory
requirements.  Currently the staging and production servers do not have a "swap"
file or device permanently assigned, nor do they have a device on which paging
space can be routinely used without incurring I/O charges.  Thus a swap file is
activated prior to an import of IL data and then deactivated afterwards, as follows::

    sudo fallocate -l 3G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    <<perform the IL data import using the appropriate mechanism>>
    sudo swapoff /swapfile
    sudo rm /swapfile


Admin
+++++

Follow the "Admin" instructions above under "Local/Development Environment".


Updating landing page stats
---------------------------

NC landing page stats are updated automatically after import.  This
section applies only to other states.  (The NC command in the example
below will work and can be used during development, but for NC it is
not necessary to run the command and update the Django template using
the output when you get a new set of data from the state.)

Currently, various statistics on the state landing page are hard-coded
in the Django templates for that state, including the number of stops,
the range of dates, and the top five agencies.

When first importing a new set of data from a state, the landing page
stats must be edited to reflect the new data.  This process involves the
following steps:

1. Calculate the statistics using the new dataset.
2. Update the Django template for the state to include the current
   statistics.
3. Pay attention to whether or not agency ids or the top five agencies
   have changed; if they have, the top five agencies as shown in the
   landing page will require more editing.

The landing page stats are computed with the ``<state_app>_dataset_facts``
management commands.  Example::

    $ ./manage.py nc_dataset_facts
    Timeframe: Jan 01, 2000 - Apr 12, 2016
    Stops: 20,622,253
    Searches: 632,719
    Agencies: 314

    Top 5:
    Id 193: NC State Highway Patrol 9,608,578
    Id 51: Charlotte-Mecklenburg Police Department 1,600,836
    Id 224: Raleigh Police Department 863,653
    Id 104: Greensboro Police Department 555,453
    Id 88: Fayetteville Police Department 503,013
