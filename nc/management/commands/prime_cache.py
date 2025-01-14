from django.core.management.base import BaseCommand

from nc.tasks import prime_all_endpoints


class Command(BaseCommand):
    """Prime cache on production server"""

    def add_arguments(self, parser):
        parser.add_argument("--clear-cache", "-c", action="store_true", default=False)
        parser.add_argument("--skip-agencies", action="store_true", default=False)
        parser.add_argument("--skip-officers", action="store_true", default=True)
        parser.add_argument("--agency-cutoff-count", type=int, default=0)
        parser.add_argument(
            "--agency-id", action="append", default=[], type=int, help="Agency ID to prime"
        )

    def handle(self, *args, **options):
        prime_all_endpoints.delay(
            clear_cache=options["clear_cache"],
            skip_agencies=options["skip_agencies"],
            skip_officers=options["skip_officers"],
            agency_cutoff_count=options["agency_cutoff_count"],
            limit_to_agencies=options["agency_id"],
        )
