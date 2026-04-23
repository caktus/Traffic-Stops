# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Overview

NC CopWatch is a data-driven application that implements a nightly ETL pipeline to download, import, and analyze the North Carolina Department of Justice's raw law enforcement traffic stop data, generating visualizations and comparative analytics for 30+ million records to promote data transparency and accountability in statewide policing.

- NC CopWatch is a Django 5.2 project built on Python 3.13.
- The front end is a React SPA built with Node.js 22 and communicates with the Django backend via a REST API using Django REST Framework.
- The main database is PostgreSQL 16.
- Celery is used for background jobs and scheduled tasks.

## Development Commands

### Environment Setup

- `uv` is used for Python dependency management.
- Install Python dependencies: `uv sync`
- Add Python dependencies: `uv add <library>` or `uv add --group dev <library>` for dev-only
- Run database migrations: `uv run ./migrate_all_dbs.sh`
- Create superuser: `uv run manage.py createsuperuser`
- You can run generic Python commands using `uv run <command>`
- You can run generic Python code using `uv run python -c "<code>"`
- The `frontend/` directory contains the React front end.
- Install Node.js dependencies: `cd frontend && npm install`

### Multiple Databases

- The project uses multiple databases: `default` and `traffic_stops_nc`.
- `django-pgviews-redux` manages PostgreSQL views and materialized views. Do **not** create Django migrations when modifying view SQL — the view schema is managed outside of the migrations system.
- After changing a view's SQL in `models.py`, apply it to the database with: `uv run manage.py sync_pgviews --database=traffic_stops_nc`
- To refresh a materialized view's data: `uv run manage.py refresh_pgviews --database=traffic_stops_nc`

### Running the Application

- Start the development server: `uv run manage.py runserver`
- Start the React development server: `cd frontend && npm run start`

### Testing

- Run tests with pytest: `uv run pytest`
- Tests are located in `tests/` directories and follow standard pytest-django and pytest-mock conventions.
- factoryboy is used for test data creation.

### Code Quality

- Run pre-commit hooks: `uv run pre-commit run --all-files`

### Deployment

- Ansible is used for deployment automation with playbooks located in the `deploy/` directory.
- Install Ansible dependencies: `uv run ansible-galaxy install -fr deploy/requirements.yml`

## Notebooks

Marimo notebooks are used for data exploration and analysis. These are interactive reactive Python notebooks stored as `.py` files (not JSON like Jupyter), making them Git-friendly and executable as scripts.

- See [marimo documentation](https://docs.marimo.io/llms.txt) for comprehensive guides on reactivity, UI elements, deployment, and more.
- Use setup cells to organize imports and dependencies that your notebook functions will reference.

### Common Commands

- `marimo check --fix notebook.py` — Check and fix notebook formatting
