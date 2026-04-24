import marimo

__generated_with = "0.23.2"
app = marimo.App(width="medium")

with app.setup(hide_code=True):
    import json
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

    from nc.models import DriverRace  # noqa
    from nc.views.likelihood import likelihood_comparison, parity_data  # noqa

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
    mo.md(r"""
    # Likelihood of Traffic Stop Comparison v3

    This notebook provides an interactive analysis of racial disparities in
    traffic stops across North Carolina. By comparing the share of the
    population to the share of traffic stops, we can estimate a Stop Rate
    Ratio (where a value of 1.0 indicates equal odds of being stopped). These
    visualizations aim to identify whether Black and Hispanic drivers are pulled
    over at higher rates than White drivers and how these patterns vary across
    municipal police and county sheriff agencies.

    Use the **Year** and **Race** filters in the sidebar to explore a specific
    year or race. The charts and tables below update reactively.
    """)
    return


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
    race_dropdown = mo.ui.dropdown(
        options={"All": None, **{r.label: r.label for r in DriverRace if r != DriverRace.WHITE}},
        value="All",
        label="Race",
    )
    return race_dropdown, year_dropdown


@app.cell(hide_code=True)
def _(mo, race_dropdown, year_dropdown):
    mo.sidebar(mo.vstack([mo.md("## Filters"), year_dropdown, race_dropdown]))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Statewide Baseline and Stop Rate Estimates

    This chart illustrates the statewide likelihood of drivers of different
    races being pulled over compared to white drivers. These statewide figures
    establish a baseline that will serve as a reference point for the graphs
    that follow.
    """)
    return


@app.cell(hide_code=True)
def _(mo, race_dropdown, year_dropdown):
    selected_year = year_dropdown.value
    selected_races = [race_dropdown.value] if race_dropdown.value else None
    year_label = str(selected_year) if selected_year else "all years"

    df_statewide: pd.DataFrame = likelihood_comparison(level="statewide", year=selected_year)
    if selected_races:
        df_statewide = df_statewide[df_statewide["driver_race"].isin(selected_races)]

    chart_df = df_statewide[df_statewide["driver_race"] != DriverRace.WHITE.label].sort_values(
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
    ## Agency-Level Disparities

    Disparities often vary dramatically from agency to agency. This chart shows
    the top 20 agencies where drivers of the selected races are most likely to
    be stopped compared to white drivers. The dashed lines mark the statewide
    average for each race.
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
    df_agency: pd.DataFrame = likelihood_comparison(level="agency", year=selected_year)
    curr_df = df_agency[df_agency["driver_race"] != DriverRace.WHITE.label]
    if selected_races:
        curr_df = curr_df[curr_df["driver_race"].isin(selected_races)]
    curr_df = curr_df.head(20)

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
    if selected_races:
        race = selected_races[0]
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
    return (df_agency,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Geographic Distribution of Stop Ratios

    This interactive choropleth map illustrates how much more likely drivers of
    the selected races are to be pulled over by sheriff agencies in each county
    compared to white drivers. Uses [North Carolina State and County Boundary
    Polygons](https://www.nconemap.gov/datasets/NCEM-GIS::north-carolina-state-and-county-boundary-polygons/about)
    for county geometries.
    """)
    return


@app.cell
def _(df_agency: pd.DataFrame, mo, race_dropdown, year_label):
    simplified_geojson_path = django_project_dir / Path(
        "nc/data/North_Carolina_State_and_County_Boundary_Polygons_simplified.geojson"
    )
    simplified_geojson = json.loads(simplified_geojson_path.read_text())

    map_race = race_dropdown.value or DriverRace.BLACK.label

    sheriff_df = df_agency[
        df_agency["group_name"].str.contains("Sheriff") & (df_agency["driver_race"] == map_race)
    ].copy()
    sheriff_df["fips3"] = sheriff_df["census_profile_id"].str[-3:]

    fig_map = px.choropleth(
        sheriff_df,
        geojson=simplified_geojson,
        locations="fips3",
        featureidkey="properties.FIPS",
        color="times_likely",
        color_continuous_scale="RdYlGn_r",
        hover_name="group_name",
        hover_data={
            "times_likely": ":.2f",
            "stops": True,
            "population": True,
            "fips3": False,
        },
        title=f"Sheriff agencies: Times as likely to be stopped as white drivers ({map_race}, {year_label})",
        labels={"times_likely": "Times as likely"},
        scope="usa",
    )
    fig_map.update_geos(fitbounds="locations", visible=False)
    fig_map.update_layout(height=600, margin={"r": 0, "t": 40, "l": 0, "b": 0})

    sheriff_plot = mo.ui.plotly(fig_map)
    sheriff_table_cols = [
        "group_name",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
    ]
    sheriff_table_df = sheriff_df[sheriff_table_cols].copy().round(2)

    mo.vstack([sheriff_plot, sheriff_table_df])

    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Visualizing Over-Policing vs. Under-Policing

    The parity plot visualizes the relationship between a group's share of the
    community and its share of traffic stops. The diagonal "Line of Fairness"
    indicates equality. Observations above the line indicate comparative
    over-policing of a demographic group, while those below the line indicate
    under-policing.
    """)
    return


@app.cell
def _(df_agency: pd.DataFrame, mo, race_dropdown, year_label):
    map_race_parity = race_dropdown.value or DriverRace.BLACK.label

    df_parity = parity_data(df_agency)
    parity_races = {map_race_parity, DriverRace.WHITE.label}
    df_parity_filtered = df_parity[df_parity["driver_race"].isin(parity_races)]

    fig_parity = px.scatter(
        df_parity_filtered,
        x="pop_share",
        y="stop_share",
        color="driver_race",
        color_discrete_map=color_map,
        hover_name="agency_name",
        hover_data={"stops": True, "excess_stops": ":.0f", "stop_rate_ratio": ":.2f"},
        title=f"<b>Parity Plot:</b> Population Share vs. Stop Share ({map_race_parity} vs. White, {year_label})",
        labels={"pop_share": "Share of Population", "stop_share": "Share of Traffic Stops"},
        opacity=0.6,
        height=700,
    )
    # Add the "Line of Fairness" (diagonal x=y)
    fig_parity.add_shape(type="line", line=dict(dash="dash", color="gray"), x0=0, x1=1, y0=0, y1=1)
    fig_parity.update_layout(xaxis_range=[0, 1], yaxis_range=[0, 1])

    parity_table_cols = [
        "agency_name",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "pop_share",
        "stop_share",
        "excess_stops",
        "stop_rate_ratio",
    ]
    parity_table_df = df_parity_filtered[parity_table_cols].copy().round(4)
    mo.vstack([mo.ui.plotly(fig_parity), parity_table_df])
    return


if __name__ == "__main__":
    app.run()
