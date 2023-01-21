from django.core.management.base import BaseCommand

from nc import prime_cache


class Command(BaseCommand):
    """Prime cache on production server"""

    def add_arguments(self, parser):
        parser.add_argument(
            "--cutoff-duration-secs",
            dest="cutoff",
            help="Stop priming cache for agencies once it takes less than this",
        )
        parser.add_argument("--clear-cache", "-c", action="store_true", default=False)
        parser.add_argument("--skip-agencies", action="store_true", default=False)
        parser.add_argument("--skip-officers", action="store_true", default=False)
        parser.add_argument(
            "--officer-cutoff-count",
            type=int,
            default=None,
        )

    def handle(self, *args, **options):
        cutoff = float(options["cutoff"]) if options["cutoff"] else None
        prime_cache.run(
            cutoff_duration_secs=cutoff,
            clear_cache=options["clear_cache"],
            skip_agencies=options["skip_agencies"],
            skip_officers=options["skip_officers"],
            officer_cutoff_count=options["officer_cutoff_count"],
        )
