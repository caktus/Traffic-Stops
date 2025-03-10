import djclick as click

from django.conf import settings

from nc.models import Agency, Search, Stop
from tsdata.dataset_facts import compute_dataset_facts


@click.command()
def command():
    facts = compute_dataset_facts(
        Agency, Stop, settings.NC_KEY, Search=Search, override_start_date="Jan 01, 2002"
    )
    for fact in facts:
        click.echo(fact)
    click.echo("")
    click.echo("Very few agencies reported before 2000, so the claimed start date is 2002.")
