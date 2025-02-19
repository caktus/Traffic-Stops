Development Setup
=================

Below you will find basic setup and deployment instructions for the NC Traffic
Stops project. To begin you should have the following applications installed on
your local development system:

- Python 3.12
- NodeJS >= 12.6.0
- `pip >= 8 or so <http://www.pip-installer.org/>`_
- Postgres >= 16

Getting Started (Docker 🐳)
---------------------------

This project supports using a `Caktus Development Container`_. Make sure you
have installed the `prerequisites`_, including the Remote Development extension
pack for VS Code.

1. **Build and start dev container:** Using the `VS Code Command Pallete`_,
   select `Dev Containers: Reopen in Container`.
2. **Install Python requirements:** Create virtual environment and install Python requirements::

    python3 -m venv /code/venv
    make setup
    (cd frontend; npm install)

3. **Setup pre-commit:** Install pre-commit to enforce a variety of community standards::

    pre-commit clean
    pre-commit install

4. **Configure named profile for the AWS CLI:** The named profile for this project
   is `trafficstops` and is configured for use. You should see project-related S3 buckets with::

    aws s3 ls

   If you see an error, please follow the `prerequisites`_ for AWS.
5. **Reset local database:** Download copy of staging database and restore it locally::

    inv aws.configure-eks-kubeconfig
    inv staging pod.get-db-dump --db-var=DATABASE_URL_NC
    dropdb --if-exists traffic_stops_nc && createdb traffic_stops_nc
    pg_restore -Ox -d $DATABASE_URL_NC < trafficstops-staging_database.dump
    rm trafficstops-staging_database.dump
    ./migrate_all_dbs.sh

6. **Import Census data:** Load American Community Survey (ACS) 5-Year Data::

    python manage.py import_census

7. **Start Python dev server:** Start the Django development server::

    python manage.py runserver 0.0.0.0:8000

8. **Start Node dev server:** Start the Node development server in a separate terminal::

    (cd frontend; npm run start)

.. _Caktus Development Container: https://caktus.github.io/developer-documentation/developer-onboarding/dev-containers/
.. _prerequisites: https://caktus.github.io/developer-documentation/developer-onboarding/dev-containers/#prerequisites
.. _VS Code Command Pallete: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette

Getting Started (Manual)
------------------------

Run PostgreSQL in Docker::

    docker compose up -d db redis

This will create a PostgreSQL server with multiple databases (see
``docker-entrypoint.postgres.sql``).

To use ``psql`` locally, make sure you have the following env variables loaded
(like with `direnv <https://github.com/direnv/direnv>`_::

    export DJANGO_SETTINGS_MODULE=traffic_stops.settings.local
    export PGHOST=127.0.0.1
    export PGPORT=9051
    export PGUSER=postgres
    export PGDATABASE=traffic_stops_nc
    export DATABASE_URL=postgres://127.0.0.1:${PGPORT}/traffic_stops
    export DATABASE_URL_NC=postgres://127.0.0.1:${PGPORT}/traffic_stops_nc

To setup your local environment you should create a virtualenv and install the
necessary requirements::

    $ which python3.12  # make sure you have Python 3.10 installed
    $ mkvirtualenv --python=`which python3.10` traffic-stops
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
