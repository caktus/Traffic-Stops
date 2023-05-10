
clean:
	@find . -name "*.pyc" -exec rm -rf {} \;
	@find . -name "__pycache__" -delete


update_requirements:
	pip install -U -q pip-tools
	pip-compile --output-file=requirements/base/base.txt requirements/base/base.in
	pip-compile --output-file=requirements/test/test.txt requirements/test/test.in
	pip-compile --output-file=requirements/dev/dev.txt requirements/dev/dev.in
	pip-compile --output-file=requirements/deploy/deploy.txt requirements/deploy/deploy.in

install_requirements:
	@echo 'Installing pip-tools...'
	export PIP_REQUIRE_VIRTUALENV=true; \
	pip install -U -q pip-tools
	@echo 'Installing requirements...'
	pip-sync requirements/base/base.txt requirements/dev/dev.txt requirements/test/test.txt

setup:
	@echo 'Setting up the environment...'
	make install_requirements

run-tests:
	@echo 'Checking for migrations'
	python manage.py makemigrations --dry-run | grep 'No changes detected' || (echo 'There are changes which require migrations.' && exit 1)
	python manage.py test


dl-db-dump:
	@echo 'Downloading new db dump from s3'
	export AWS_PROFILE=copwatch
	inv aws.configure-eks-kubeconfig
	inv staging pod.get-db-dump --db-var=DATABASE_URL_NC

refresh-view:
	@echo 'Migrating all databases'
	./migrate_all_dbs.sh
	@echo 'Refreshing the StopSummary materialized view'
	python manage.py refresh_pgviews --database=traffic_stops_nc
