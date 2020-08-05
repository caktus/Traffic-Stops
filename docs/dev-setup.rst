Development Setup
=================

Below you will find basic setup and deployment instructions for the NC Traffic
Stops project. To begin you should have the following applications installed on
your local development system:

- Python 3.8
- NodeJS >= 10.21.0
- `pip >= 8 or so <http://www.pip-installer.org/>`_
- `virtualenv >= 1.10 <http://www.virtualenv.org/>`_
- `virtualenvwrapper >= 3.0 <http://pypi.python.org/pypi/virtualenvwrapper>`_
- Postgres >= 12


Getting Started
---------------

Run PostgreSQL in Docker::

    docker-compose up -d

This will create a PostgreSQL server with multiple databases (see
``docker-entrypoint.postgres.sql``).

To use ``psql`` locally, make sure you have the following env variables loaded
(like with `direnv <https://github.com/direnv/direnv>`_::

    export DJANGO_SETTINGS_MODULE=traffic_stops.settings.local
    export PGHOST=127.0.0.1
    export PGPORT=54344
    export PGUSER=postgres
    export PGDATABASE=traffic_stops
    export DATABASE_URL=postgres://127.0.0.1:54344/traffic_stops
    export DATABASE_URL_NC=postgres://127.0.0.1:54344/traffic_stops_nc
    export DATABASE_URL_MD=postgres://127.0.0.1:54344/traffic_stops_md
    export DATABASE_URL_IL=postgres://127.0.0.1:54344/traffic_stops_il

To setup your local environment you should create a virtualenv and install the
necessary requirements::

    $ which python3.8  # make sure you have Python 3.8 installed
    $ mkvirtualenv --python=`which python3.8` traffic-stops
    (traffic-stops)$ pip install -U pip
    (traffic-stops)$ make setup
    (traffic-stops)$ npm install

If ``npm install`` fails, make sure you're using ``npm`` from a reasonable version
of NodeJS, as documented at the top of this document.

Next, we'll set up our local environment variables. We use `django-dotenv
<https://github.com/jpadilla/django-dotenv>`_ to help with this. It reads environment variables
located in a file name ``.env`` in the top level directory of the project. The only variable we need
to start is ``DJANGO_SETTINGS_MODULE``::

    (traffic-stops)$ cp traffic_stops/settings/local.example.py traffic_stops/settings/local.py
    (traffic-stops)$ echo "DJANGO_SETTINGS_MODULE=traffic_stops.settings.local" > .env

Exit the virtualenv and reactivate it to activate the settings just changed::

    (traffic-stops)$ deactivate
    (traffic-stops)$ workon traffic-stops

Migrate the project databases::

    (traffic-stops)$ ./migrate_all_dbs.sh


Development
-----------

You should be able to run the development server via the configured ``dev`` script::

    (traffic-stops)$ npm run dev

Or, on a custom port and address::

    (traffic-stops)$ npm run dev -- --address=0.0.0.0 --port=8020

Any changes made to Python, Javascript or Less files will be detected and rebuilt transparently as
long as the development server is running.


When running migrations
-----------------------

This is a multi-database project.  Whenever you have unapplied migrations,
either added locally or via an update from the source repository, the
migrations need to be applied to all databases by running the
``./migrate_all_dbs.sh`` command.


Docker
======

You can use the provided ``docker-compose`` environment to create a local development environment.
See previous section for more detailed instructions about how this project is configured.

Setup your local development settings::

  cp traffic_stops/settings/local.example.py traffic_stops/settings/local.py
  # uncomment lines below "UNCOMMENT BELOW IF USING DOCKER SETUP" in local.py
  echo "DJANGO_SETTINGS_MODULE=traffic_stops.settings.local" > .env

For basic setup, run the following commands::

  docker-compose up -d db  # start the PostgreSQL container in the background
  docker-compose build web  # build the container (can take a while)
  docker-compose run --rm web createdb -E UTF-8 traffic_stops
  docker-compose run --rm web createdb -E UTF-8 traffic_stops_nc
  docker-compose run --rm web createdb -E UTF-8 traffic_stops_md
  docker-compose run --rm web createdb -E UTF-8 traffic_stops_il
  docker-compose run --rm web ./migrate_all_dbs.sh

Run ``npm install`` inside the ``web`` container (you'll need to do this for any update to
``package.json``)::

  rm -rf ./node_modules  # if needed
  docker-compose run --rm web bash -lc "npm install"

You can now run the web container and tail the logs::

  # start up the dev server, and watch the logs:
  docker-compose up -d web && docker-compose logs -f web

These are other useful docker-compose commands::

  # explicitly execute runserver in the foreground (for breakpoints):
  docker-compose stop web
  docker-compose run --rm --service-ports web python manage.py runserver 0.0.0.0:8000

Visit http://localhost:8003/ in your browser.


Restore Production Data
-----------------------

The data import process for each state can take a long time. You can load the production data using
the following steps:

First download a dump (in this case, NC) of the database::

  ssh opendatapolicing.com 'sudo -u postgres pg_dump -Fc -Ox traffic_stops_nc_production' > traffic_stops_nc_production.pgdump

Now run ``pg_restore`` within the ``web`` container::

  docker-compose stop web  # free up connections to the DB
  docker-compose run --rm web dropdb traffic_stops_nc
  docker-compose run --rm web createdb -E UTF-8 traffic_stops_nc
  docker-compose run --rm web pg_restore -Ox -d traffic_stops_nc traffic_stops_nc_production.pgdump
  rm traffic_stops_nc_production.pgdump  # so it doesn't get built into the container

You can also load the primary DB with user accounts and state statistics::

  ssh opendatapolicing.com 'sudo -u postgres pg_dump -Fc -Ox traffic_stops_production' > traffic_stops_production.pgdump
  docker-compose stop web  # free up connections to the DB
  docker-compose run --rm web dropdb traffic_stops
  docker-compose run --rm web createdb -E UTF-8 traffic_stops
  docker-compose run --rm web pg_restore -Ox -d traffic_stops traffic_stops_production.pgdump
  rm traffic_stops_production.pgdump  # so it doesn't get built into the container


Deployment
----------

You can run a deployment from within a docker container using the following commands::

  docker-compose run --rm web /bin/bash
  eval $(ssh-agent)
  ssh-add ~/.ssh/YOUR_KEY

  fab -u YOUR_USER staging salt:"test.ping"
