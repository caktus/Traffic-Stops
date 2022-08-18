FROM node:16-bullseye-slim as static_files

WORKDIR /code
ENV PATH /code/node_modules/.bin:$PATH
COPY frontend/package.json frontend/package-lock.json /code/
RUN npm install --silent
COPY frontend/ /code/
RUN npm run build

FROM python:3.8-slim-bullseye as base

# Create a group and user to run our app
ARG APP_USER=appuser
RUN groupadd -r ${APP_USER} && useradd --no-log-init -r -g ${APP_USER} ${APP_USER}

# Install packages needed to run your application (not build deps):
#   mime-support -- for mime types when serving static files
#   postgresql-client -- for running database commands
# We need to recreate the /usr/share/man/man{1..8} directories first because
# they were clobbered by a parent image.
RUN set -ex \
    && RUN_DEPS=" \
    libpcre3 \
    mime-support \
    postgresql-client \
    vim \
    " \
    && seq 1 8 | xargs -I{} mkdir -p /usr/share/man/man{} \
    && apt-get update && apt-get install -y --no-install-recommends $RUN_DEPS \
    && rm -rf /var/lib/apt/lists/*

# Copy in your requirements file
# ADD requirements.txt /requirements.txt

# OR, if you're using a directory for your requirements, copy everything (comment out the above and uncomment this if so):
ADD requirements /requirements

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
# Correct the path to your production requirements file, if needed.
RUN set -ex \
    && BUILD_DEPS=" \
    build-essential \
    libpcre3-dev \
    libpq-dev \
    git-core \
    " \
    && apt-get update && apt-get install -y --no-install-recommends $BUILD_DEPS \
    && pip install -U -q pip-tools \
    && pip-sync requirements/base/base.txt requirements/deploy/deploy.txt \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $BUILD_DEPS \
    && rm -rf /var/lib/apt/lists/*

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

# uWSGI static file serving configuration (customize or comment out if not needed):
ENV UWSGI_STATIC_MAP="/static/=/code/static/" UWSGI_STATIC_EXPIRES_URI="/static/.*\.[a-f0-9]{12,}\.(css|js|png|jpg|jpeg|gif|ico|woff|ttf|otf|svg|scss|map|txt) 315360000"

# Change to a non-root user
USER ${APP_USER}:${APP_USER}

# Uncomment after creating your docker-entrypoint.sh
ENTRYPOINT ["/code/docker-entrypoint.sh"]

# Start uWSGI
CMD ["newrelic-admin", "run-program", "uwsgi", "--single-interpreter", "--enable-threads", "--show-config"]

FROM base AS dev

SHELL ["/bin/bash", "-c"]

# Install packages needed to develop your application (not build deps):
#   nodejs -- for React SPA
# We need to recreate the /usr/share/man/man{1..8} directories first because
# they were clobbered by a parent image.
ENV KUBE_LATEST_VERSION="v1.22.11"
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    --mount=type=cache,mode=0755,target=/root/.cache/pip \
    set -ex \
    && DEV_DEPS=" \
    nodejs \
    git-core \
    " \
    && seq 1 8 | xargs -I{} mkdir -p /usr/share/man/man{} \
    && apt-get update \
    && apt-get -y install wget curl gnupg2 lsb-release \
    # Node
    && sh -c 'echo "deb https://deb.nodesource.com/node_16.x $(lsb_release -cs) main" > /etc/apt/sources.list.d/nodesource.list' \
    && wget --quiet -O- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
    && apt-get update \
    && apt-get install -y --no-install-recommends $DEV_DEPS \
    # kubectl
    && export ARCH="$(uname -m)" && if [ ${ARCH} == "x86_64" ]; then export ARCH="amd64"; elif [ ${ARCH} == "aarch64" ]; then export ARCH="arm64"; fi \
    && curl -L https://dl.k8s.io/release/${KUBE_LATEST_VERSION}/bin/linux/${ARCH}/kubectl -o /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && rm -rf /var/lib/apt/lists/*

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
# Correct the path to your production requirements file, if needed.
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    --mount=type=cache,mode=0755,target=/root/.cache/pip \
    set -ex \
    && BUILD_DEPS=" \
    build-essential \
    " \
    && apt-get update && apt-get install -y --no-install-recommends $BUILD_DEPS \
    && pip-sync requirements/base/base.txt requirements/dev/dev.txt requirements/test/test.txt \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $BUILD_DEPS \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built node_modules into dev image for React
COPY --from=static_files /code/node_modules /code/node_modules

# Copy your application code to the container (make sure you create a .dockerignore file if any large files or directories should be excluded)
RUN mkdir -p /code/
WORKDIR /code/
ADD . /code/

CMD ["python", "/code/manage.py", "runserver", "0.0.0.0:8000"]
