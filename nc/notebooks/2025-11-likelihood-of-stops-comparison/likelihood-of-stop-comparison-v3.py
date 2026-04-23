import marimo

__generated_with = "0.23.2"
app = marimo.App(width="medium")

with app.setup(hide_code=True):
    import os
    import sys

    from io import StringIO
    from pathlib import Path

    import pandas as pd
    import plotly.express as px

    from dotenv import load_dotenv

    django_project_dir = Path(__file__).parent.joinpath("../../..").resolve()

    def load_envrc():
        """Load .envrc from the Django project root so environment variables are
        available regardless of the working directory marimo is launched from."""

        envrc = django_project_dir / ".envrc"
        stream = StringIO()
        [
            stream.write(f"{line}\n")
            for line in envrc.read_text().splitlines()
            if line.startswith("export")
        ]
        stream.seek(0)

        load_dotenv(stream=stream)

    load_envrc()

    sys.path.insert(0, str(django_project_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "traffic_stops.settings.dev")
    os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

    import django  # noqa

    django.setup()

    from nc.views.likelihood import likelihood_comparison  # noqa

    color_map = {
        "Asian": "#F9DC4E",
        "Black": "#551DC3",
        "Hispanic": "#D24B76",
        "Native American": "#24BC7D",
        "Other": "#999999",
        "White": "#1282A2",
    }


@app.cell(hide_code=True)
def _():
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def _(mo):
    from django.db.models.functions import ExtractYear

    from nc.models import StopSummary

    years = list(
        StopSummary.objects.annotate(year=ExtractYear("date"))
        .values_list("year", flat=True)
        .distinct()
        .order_by("-year")
    )
    year_dropdown = mo.ui.dropdown(
        options={"All": None, **{str(y): y for y in years}},
        value="All",
        label="Year",
    )
    ALL_RACES = ["Asian", "Black", "Hispanic", "Native American", "Other", "White"]
    race_multiselect = mo.ui.multiselect(
        options=ALL_RACES,
        value=[r for r in ALL_RACES if r != "White"],
        label="Race",
    )
    mo.hstack([year_dropdown, race_multiselect])
    return race_multiselect, year_dropdown


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Statewide

    This chart illustrates the statewide likelihood of drivers of different races being pulled over compared to white drivers. These statewide figures establish a baseline that will serve as a reference point for the graphs that follow.
    """)
    return


@app.cell(hide_code=True)
def _(mo, race_multiselect, year_dropdown):
    selected_year = year_dropdown.value
    selected_races = [str(s) for s in race_multiselect.value] if race_multiselect.value else None
    year_label = str(selected_year) if selected_year else "all years"

    df_statewide: pd.DataFrame = likelihood_comparison(
        level="statewide", year=selected_year, races=selected_races
    )

    chart_df = df_statewide[df_statewide["driver_race"] != "White"].sort_values(
        "times_likely", ascending=False
    )

    fig_statewide = px.bar(
        chart_df,
        x="driver_race",
        y="times_likely",
        color="driver_race",
        color_discrete_map=color_map,
        title=f"Statewide: Times as likely to be stopped as white drivers by race ({year_label})",
        labels={
            "times_likely": "Times as likely",
            "driver_race": "Race",
        },
        text="times_likely",
        text_auto=",.1f",
        height=500,
        category_orders={"driver_race": chart_df["driver_race"].tolist()},
    )
    plot_statewide = mo.ui.plotly(
        fig_statewide.update_yaxes(tickformat=",.1f").update_traces(textangle=0)
    )

    table_cols = [
        "driver_race",
        "population",
        "total_population",
        "stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
    ]
    table_df = df_statewide[table_cols].copy()
    mo.vstack([plot_statewide, table_df.round(2)])
    return df_statewide, selected_races, selected_year, year_label


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Top 20: Agency-level comparison

    This chart shows the top 20 agencies where drivers of the selected races are most likely to be stopped compared to white drivers. The dashed lines mark the statewide average for each race.
    """)
    return


@app.cell
def _(
    df_statewide: pd.DataFrame,
    mo,
    selected_races,
    selected_year,
    year_label,
):
    df_agency: pd.DataFrame = likelihood_comparison(
        level="agency", year=selected_year, races=selected_races
    )
    curr_df = df_agency[df_agency["driver_race"] != "White"].head(20)

    fig = px.bar(
        curr_df,
        x="agency_name_race",
        y="times_likely",
        color="driver_race",
        color_discrete_map=color_map,
        title=f"Top 20: Times as likely to be pulled over as white drivers (agency, {year_label})",
        labels={
            "times_likely": "Times as likely",
            "driver_race": "Race",
            "agency_name_race": "Agency - Race",
        },
        text="times_likely",
        text_auto=",.1f",
        height=600,
        category_orders={"agency_name_race": curr_df["agency_name_race"].tolist()},
    )
    if selected_races and len(selected_races) == 1:
        for race in selected_races:
            row = df_statewide[df_statewide["driver_race"] == race]
            if not row.empty:
                fig.add_hline(
                    y=row.iloc[0]["times_likely"],
                    line_dash="dash",
                    line_color=color_map.get(race, "gray"),
                    annotation_text=f"NC Avg ({race})",
                    annotation_position="top right",
                )
    plot = mo.ui.plotly(fig.update_yaxes(tickformat=",.1f").update_traces(textangle=0))

    agency_table_cols = [
        "agency_name_race",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
    ]
    agency_top20 = curr_df[agency_table_cols].copy().round(2)
    mo.vstack([plot, agency_top20])
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
