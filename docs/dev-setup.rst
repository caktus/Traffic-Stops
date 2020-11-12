Development Setup
=================

Below you will find basic setup and deployment instructions for the NC Traffic
Stops project. To begin you should have the following applications installed on
your local development system:

- Python 3.8
- NodeJS >= 12.6.0
- `pip >= 8 or so <http://www.pip-installer.org/>`_
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

To setup your local environment you should create a virtualenv and install the
necessary requirements::

    $ which python3.8  # make sure you have Python 3.8 installed
    $ mkvirtualenv --python=`which python3.8` traffic-stops
    (traffic-stops)$ pip install -U pip
    (traffic-stops)$ make setup

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


Frontend setup::

  (traffic-stops)$ cd frontend
  (traffic-stops)$ npm i 

If ``npm install`` fails, make sure you're using ``npm`` from a reasonable version
of NodeJS, as documented at the top of this document.


Development
-----------

Start API dev server::

    (traffic-stops)$ ./manage.py runserver

In another terminal window, start the frontend dev server::

    (traffic-stops)$ cd frontend
    (traffic-stops)$ npm run start

Any changes made to Python, Javascript or Less files will be detected and rebuilt transparently as
long as both dev servers are running.


When running migrations
-----------------------

This is a multi-database project.  Whenever you have unapplied migrations,
either added locally or via an update from the source repository, the
migrations need to be applied to all databases by running the
``./migrate_all_dbs.sh`` command.
