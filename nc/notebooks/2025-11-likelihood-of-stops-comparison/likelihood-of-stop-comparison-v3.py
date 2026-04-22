import marimo

__generated_with = "0.23.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _():
    from io import StringIO
    from pathlib import Path

    from dotenv import load_dotenv

    django_project_dir = Path("../../..").resolve()

    def load_envrc():
        """VS Code's Jupyter extension doesn't support loading .envrc, so if you're
        using VS Code, we load it here."""

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
    return (django_project_dir,)


@app.cell
def _(django_project_dir):
    import os
    import sys

    sys.path.insert(0, str(django_project_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "traffic_stops.settings.dev")
    os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

    import django  # noqa

    django.setup()
    return


@app.cell
def _():
    import warnings

    import pandas as pd
    import plotly.express as px

    from nc.views.likelihood import likelihood_comparison

    warnings.filterwarnings("ignore", category=FutureWarning, module="plotly")

    color_map = {
        "Asian": "#F9DC4E",
        "Black": "#551DC3",
        "Hispanic": "#D24B76",
        "Native American": "#24BC7D",
        "Other": "#999999",
        "White": "#1282A2",
    }
    pd.set_option("display.max_rows", 500)
    return color_map, likelihood_comparison, pd, px


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Statewide

    This chart illustrates the statewide likelihood of drivers of different races being pulled over compared to white drivers. These statewide figures establish a baseline that will serve as a reference point for the graphs that follow.
    """)
    return


@app.cell
def _(color_map, likelihood_comparison, mo, pd, px):
    df_statewide: pd.DataFrame = likelihood_comparison(level="statewide")

    chart_df = df_statewide[df_statewide["driver_race"] != "White"].sort_values(
        "times_likely", ascending=False
    )

    fig_statewide = px.bar(
        chart_df,
        x="driver_race",
        y="times_likely",
        color="driver_race",
        color_discrete_map=color_map,
        title="Statewide: Times as likely to be stopped as white drivers by race (all years)",
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
    table = mo.ui.table(table_df)

    mo.vstack([plot_statewide, table])
    return


@app.cell
def _(color_map, likelihood_comparison, mo, pd, px):
    df_agency: pd.DataFrame = likelihood_comparison(level="agency")
    curr_df = df_agency[df_agency["driver_race"] != "White"].head(20)

    fig = px.bar(
        curr_df,
        x="agency_name_race",
        y="times_likely",
        color="driver_race",
        color_discrete_map=color_map,
        title="Top 20: Times as likely to be pulled over as white drivers (agency, all years)",
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
    plot = mo.ui.plotly(fig.update_yaxes(tickformat=",.1f").update_traces(textangle=0))
    plot
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
