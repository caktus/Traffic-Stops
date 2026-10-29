# NC CopWatch

Code for [nccopwatch.org](https://nccopwatch.org/), a project by [Forward
Justice](https://forwardjustice.org/) that visualizes traffic stops by law
enforcement agencies in North Carolina.

## Development Setup

Prerequisites: Python 3.13, Node.js >= 22, [uv](https://docs.astral.sh/uv/getting-started/installation/), [direnv](https://direnv.net/), PostgreSQL >= 16.

1. **Start local services** (PostgreSQL on port 9051, Redis):

   ```bash
   docker compose up -d db redis
   ```
2. **Configure environment:** copy `traffic_stops/settings/local.example.py`
   to `traffic_stops/settings/local.py`.
3. **Install dependencies:** with [direnv](https://direnv.net/), first add a
   root-level `.envrc` containing:

   ```bash
   unset VIRTUAL_ENV
   uv sync --locked
   PATH_add .venv/bin

   export DJANGO_SETTINGS_MODULE=traffic_stops.settings.local
   export KUBECONFIG=$PWD/deploy/.kube/config
   export PGHOST=127.0.0.1   # local Postgres from docker compose
   export PGPORT=9051
   ```

   Then install:

   ```bash
   uv sync
   (cd frontend; npm install)
   ```
4. **Install pre-commit hooks:**

   ```bash
   pre-commit clean && pre-commit install
   ```
5. **Restore the local database:** get a staging database dump from S3 by
   asking a team member, then:

   ```bash
   dropdb --if-exists traffic_stops_nc && createdb traffic_stops_nc
   pg_restore -Ox -d traffic_stops_nc trafficstops-staging_database.dump
   ```
6. **Run migrations on all databases** (also required after pulling unapplied upstream migrations):

   ```bash
   uv run ./migrate_all_dbs.sh
   ```
7. **Import census data** (American Community Survey 5-Year data):

   ```bash
   uv run manage.py import_census
   ```
8. **Start the dev servers** (two terminals):

   ```bash
   uv run manage.py runserver
   (cd frontend; npm run start)
   ```

Run tests with `uv run pytest` and code checks with
`uv run pre-commit run --all-files`.

## Data Import

To import the NC traffic stop data (~25 minutes):

```bash
rm -rf ./ncdata  # if you don't want to reuse previous download
uv run manage.py import_nc --dest $PWD/ncdata --noprime  # noprime = don't prime cache
```

Reusing an existing `--dest` directory speeds up the import; only reuse it if
the import code hasn't changed since it was last used.

## Census Data

To refresh the census (ACS) data, e.g. for a new ACS release:

1. Add APY key to `.envrc`:

   ```
   CENSUS_API_KEY=***
   ```
2. Download the data (without `CENSUS_API_KEY` set, the command exits with an
   error pointing to the key sign-up page):

   ```bash
   uv run manage.py import_census --use-api --output > acs-2022.json
   ```
3. Upload to the S3 bucket:

   ```bash
   aws s3 cp acs-2022.json s3://nccopwatch/ --acl public-read
   ```

## Deployment / Hosting Services

Deployment uses Ansible playbooks in `deploy/`; AWS credentials for the
project account are assumed to be configured locally.

```bash
cd deploy
uv run ansible-galaxy install -fr deploy/requirements.yml
```

- `deploy/deploy-cf-stack.yml` provisions the EKS cluster (CloudFormation).
- `deploy/deploy-cluster.yml` configures the cluster for the web apps.
- `deploy/deploy.yml` deploys/updates the application.
- `deploy/eks-updates.yml` updates EKS addons and nodegroup AMIs.

### Hosting services

[Ansible role k8s-hosting-services](https://github.com/caktus/ansible-role-k8s-hosting-services)
manages PostgreSQL backup-to-S3 and New Relic logging/monitoring.
`traffic_stops` is backed up; `traffic_stops_nc` is not, since the state
dataset is large and re-importable.

```bash
cd deploy
uv run inv playbook -n deploy-hosting-services.yml
```
