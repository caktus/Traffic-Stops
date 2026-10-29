FROM node:22.18.0-bullseye-slim AS static_files

WORKDIR /code
ENV PATH=/code/node_modules/.bin:$PATH
COPY frontend/package.json frontend/package-lock.json /code/
RUN npm install --silent
COPY frontend/ /code/
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.13-bookworm AS base

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Use a custom VIRTUAL_ENV with uv to avoid conflicts with local developer's
# .venv/ while running tests in Docker
ENV VIRTUAL_ENV=/venv

# Create a group and user to run our app
ARG APP_USER=appuser
RUN groupadd -r ${APP_USER} && useradd --no-log-init -r -g ${APP_USER} ${APP_USER}

ENV POSTGRESQL_CLIENT_VERSION="16"
# Install packages needed to run your application (not build deps):
#   postgresql-client -- for running database commands
# We need to recreate the /usr/share/man/man{1..8} directories first because
# they were clobbered by a parent image.
RUN set -ex \
    && RUN_DEPS=" \
    libpcre3 \
    mime-support \
    postgresql-client-${POSTGRESQL_CLIENT_VERSION} \
    vim \
    " \
    && seq 1 8 | xargs -I{} mkdir -p /usr/share/man/man{} \
    && apt-get update && apt-get -y upgrade && apt-get -y install wget gnupg2 lsb-release \
    && sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update && apt-get install -y --no-install-recommends $RUN_DEPS \
    && rm -rf /var/lib/apt/lists/*

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
# Correct the path to your production requirements file, if needed.
ARG UV_OPTS="--no-dev --group deploy"
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    set -ex \
    && BUILD_DEPS=" \
    build-essential \
    libpcre3-dev \
    libpq-dev \
    git-core \
    " \
    && apt-get update && apt-get install -y --no-install-recommends $BUILD_DEPS \
    && uv venv $VIRTUAL_ENV \
    && uv sync --active --locked --no-install-project $UV_OPTS \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $BUILD_DEPS \
    && rm -rf /var/lib/apt/lists/*

# Add uv venv to PATH
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

FROM base AS deploy

# Copy your application code to the container (make sure you create a .dockerignore file if any large files or directories should be excluded)
RUN mkdir /code/
WORKDIR /code/
ADD . /code/

# Copy React SPA build into final image
COPY --from=static_files /code/build /code/build

# uWSGI will listen on this port
EXPOSE 8000

# Add any static environment variables needed by Django or your settings file here:
ENV DJANGO_SETTINGS_MODULE=traffic_stops.settings.deploy

# Call collectstatic (customize the following line with the minimal environment variables needed for manage.py to run):
RUN DATABASE_URL='' ENVIRONMENT='' DJANGO_SECRET_KEY='dummy' DOMAIN='' python manage.py collectstatic --noinput

# Tell uWSGI where to find your wsgi file (change this):
ENV UWSGI_WSGI_FILE=traffic_stops/wsgi.py

# Base uWSGI configuration (you shouldn't need to change these):
ENV UWSGI_HTTP=:8000 UWSGI_MASTER=1 UWSGI_HTTP_AUTO_CHUNKED=1 UWSGI_HTTP_KEEPALIVE=1 UWSGI_LAZY_APPS=1 UWSGI_WSGI_ENV_BEHAVIOR=holy UWSGI_IGNORE_SIGPIPE=true UWSGI_IGNORE_WRITE_ERRORS=true UWSGI_DISABLE_WRITE_EXCEPTION=true

# Number of uWSGI workers and threads per worker (customize as needed):
ENV UWSGI_WORKERS=2 UWSGI_THREADS=4

# Reload workers after the specified amount of managed requests (avoid memory leaks)
ENV UWSGI_MAX_REQUESTS=1000

# uWSGI static file serving configuration (customize or comment out if not needed):
ENV UWSGI_STATIC_MAP="/static/=/code/static/" UWSGI_STATIC_EXPIRES_URI="/static/.*\.[a-f0-9]{12,}\.(css|js|png|jpg|jpeg|gif|ico|woff|ttf|otf|svg|scss|map|txt) 315360000"

RUN touch /code/.env

# Change to a non-root user
USER ${APP_USER}:${APP_USER}

# Uncomment after creating your docker-entrypoint.sh
ENTRYPOINT ["/code/docker-entrypoint.sh"]

# Start uWSGI
CMD ["newrelic-admin", "run-program", "uwsgi", "--single-interpreter", "--enable-threads", "--show-config"]
