#!/usr/bin/env bash

set -ex

python manage.py migrate --noinput "$@"
for state_code in nc; do
    python manage.py migrate --noinput --database traffic_stops_${state_code} "$@"
done
