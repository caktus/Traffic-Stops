import marimo

__generated_with = "0.23.2"
app = marimo.App(width="medium")

with app.setup(hide_code=True):
    import datetime as dt
    import json
    import os
    import sys

    from io import StringIO
    from pathlib import Path

    import pandas as pd
    import plotly.express as px
    import plotly.graph_objects as go

    from dotenv import load_dotenv

    django_project_dir = Path(__file__).parent.joinpath("../../..").resolve()

    def load_envrc():
        """Load .envrc from the Django project root so environment variables are
        available regardless of the working directory marimo is launched from."""

        envrc = django_project_dir / ".envrc"
        if not envrc.exists():
            return
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
    from nc.views.likelihood import available_likelihood_years, likelihood_comparison, parity_data  # noqa

    color_map = {
        "Asian": "#F9DC4E",
        "Black": "#551DC3",
        "Hispanic": "#D24B76",
        "Native American": "#24BC7D",
        "Other": "#999999",
        "White": "#1282A2",
    }


@app.cell(hide_code=True)
def marimo_imports():
    """Import the marimo library for building the interactive notebook UI."""
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def notebook_header(mo):
    """Render the notebook title and description as a markdown header."""
    last_updated = dt.datetime.fromtimestamp(Path(__file__).stat().st_mtime).strftime("%B %d, %Y")
    mo.md(rf"""
    # Likelihood of Traffic Stop Comparison v3

    This notebook provides an interactive analysis of racial disparities in
    traffic stops across North Carolina. By comparing the share of the
    population to the share of traffic stops, we can estimate a Stop Rate Ratio
    (where a value of 1.0 indicates equal odds of being stopped).

    Use the **Year** and **Race** filters in the sidebar to explore a specific
    year or race. The charts and tables below update reactively.

    *Last updated: {last_updated}*
    """)
    return


@app.cell(hide_code=True)
def filters(mo):
    """Build year and race dropdown filters from census-backed years and race labels."""
    years = available_likelihood_years()
    year_options = {"All": None, **{str(y): y for y in years}}
    year_dropdown = mo.ui.dropdown(
        options=year_options,
        value="All",
        label="Year",
    )
    race_options = {r.label: r.label for r in DriverRace if r != DriverRace.WHITE}
    race_dropdown = mo.ui.dropdown(
        options=race_options,
        value=(
            DriverRace.BLACK.label
            if DriverRace.BLACK.label in race_options
            else next(iter(race_options.values()), None)
        ),
        label="Race",
    )
    return race_dropdown, year_dropdown


@app.cell(hide_code=True)
def sidebar(layout_toggle, min_stops_slider, mo, race_dropdown, scale_toggle, year_dropdown):
    """Render the sidebar containing the year, race, and disparity map filter controls."""
    mo.sidebar(
        mo.vstack(
            [
                mo.md("## Filters"),
                year_dropdown,
                race_dropdown,
                mo.md("---"),
                mo.md("**Agency Disparity Map**"),
                layout_toggle,
                scale_toggle,
                min_stops_slider,
            ]
        )
    )
    return


@app.cell(hide_code=True)
def selected_filters(race_dropdown, year_dropdown):
    """Normalize selected filter values for downstream chart cells."""
    selected_year = year_dropdown.value
    selected_races = [race_dropdown.value] if race_dropdown.value else None
    year_label = str(selected_year) if selected_year else "all years"
    return selected_races, selected_year, year_label


@app.cell(hide_code=True)
def agency_section_header(mo):
    """Render the section header for the agency-level disparities chart."""
    mo.md(r"""
    ## Agency-Level Disparities

    Disparities often vary dramatically from agency to agency. This chart shows
    the top 20 agencies where drivers of the selected races are most likely to
    be stopped compared to white drivers. A dashed line marks baseline equity
    (1.0), and a dotted line marks the statewide average for the selected race.
    """)
    return


@app.cell
def top_20_agency_chart(
    mo,
    selected_races,
    selected_year,
    year_label,
):
    """Render top-20 agency disparities with statewide-average and equity reference lines."""
    df_statewide: pd.DataFrame = likelihood_comparison(level="statewide", year=selected_year)
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
    fig.add_hline(
        y=1,
        line_dash="dash",
        line_color="#FF8C00",
        line_width=2,
    )
    fig.add_trace(
        go.Scatter(
            x=[None],
            y=[None],
            mode="lines",
            line=dict(dash="dash", color="#FF8C00", width=2),
            name="Baseline Equity (1.0)",
            showlegend=True,
        )
    )
    if selected_races:
        race = selected_races[0]
        row = df_statewide[df_statewide["driver_race"] == race]
        if not row.empty:
            fig.add_hline(
                y=row.iloc[0]["times_likely"],
                line_dash="dot",
                line_color="#FF1493",
                line_width=2,
            )
            fig.add_trace(
                go.Scatter(
                    x=[None],
                    y=[None],
                    mode="lines",
                    line=dict(dash="dot", color="#FF1493", width=2),
                    name=f"Statewide Average ({race})",
                    showlegend=True,
                )
            )
    plot = mo.ui.plotly(
        fig.update_yaxes(tickformat=",.1f").update_traces(textangle=0, selector=dict(type="bar"))
    )

    agency_table_cols = [
        "agency_name_race",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "total_stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
    ]
    agency_top20 = curr_df[agency_table_cols].copy().round(2)
    mo.vstack([plot, agency_top20])
    return (df_agency,)


@app.cell(hide_code=True)
def map_section_header(mo):
    """Render the section header for the geographic choropleth map."""
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
def sheriff_choropleth_map(df_agency: pd.DataFrame, mo, race_dropdown, year_label):
    """Render a choropleth map of stop rate ratios for sheriff agencies by county."""
    simplified_geojson_path = django_project_dir / Path(
        "nc/data/North_Carolina_State_and_County_Boundary_Polygons_simplified.geojson"
    )
    simplified_geojson = json.loads(simplified_geojson_path.read_text())

    _map_race_sheriff = race_dropdown.value or DriverRace.BLACK.label

    sheriff_df = df_agency[
        df_agency["group_name"].str.contains("Sheriff")
        & (df_agency["driver_race"] == _map_race_sheriff)
    ].copy()
    sheriff_df["fips3"] = sheriff_df["census_profile_id"].str[-3:]

    # Build full county DataFrame so missing counties render as gray
    all_fips = [
        (f["properties"]["FIPS"], f["properties"]["County"]) for f in simplified_geojson["features"]
    ]
    all_counties_df = pd.DataFrame(all_fips, columns=["fips3", "county_name"])
    full_df = all_counties_df.merge(
        sheriff_df[["fips3", "times_likely", "group_name", "stops", "population"]],
        on="fips3",
        how="left",
    )
    missing_df = full_df[full_df["times_likely"].isna()]
    data_df = full_df[full_df["times_likely"].notna()]

    fig_map = go.Figure()

    # Gray base layer for counties without sheriff data
    fig_map.add_trace(
        go.Choropleth(
            geojson=simplified_geojson,
            locations=missing_df["fips3"],
            z=[0] * len(missing_df),
            featureidkey="properties.FIPS",
            colorscale=[[0, "#cccccc"], [1, "#cccccc"]],
            customdata=missing_df[["county_name"]].values,
            showscale=False,
            hovertemplate="<b>%{customdata[0]} County</b><br>No data available.<br>Requires county ≥ 10k residents and selected race ≥ 100 residents.<extra></extra>",
            name="No Data",
            showlegend=True,
            marker_line_color="white",
            marker_line_width=0.5,
        )
    )

    # Data layer for counties with sheriff data
    fig_map.add_trace(
        go.Choropleth(
            geojson=simplified_geojson,
            locations=data_df["fips3"],
            z=data_df["times_likely"],
            featureidkey="properties.FIPS",
            colorscale="RdYlGn_r",
            customdata=data_df[["group_name", "stops", "population"]].values,
            hovertemplate=(
                "<b>%{customdata[0]}</b><br>"
                "Times as likely: %{z:.2f}<br>"
                "Stops: %{customdata[1]}<br>"
                "Population: %{customdata[2]}<extra></extra>"
            ),
            colorbar=dict(title="Times as<br>likely"),
            name="Sheriff Agencies",
            showlegend=False,
            marker_line_color="white",
            marker_line_width=0.5,
        )
    )

    fig_map.update_layout(
        title_text=f"Sheriff agencies: Times as likely to be stopped as white drivers ({_map_race_sheriff}, {year_label})",
        height=600,
        margin={"r": 0, "t": 40, "l": 0, "b": 0},
        legend=dict(x=0.01, y=0.05),
    )
    fig_map.update_geos(fitbounds="locations", visible=False, scope="usa")

    sheriff_plot = mo.ui.plotly(fig_map)
    sheriff_table_cols = [
        "group_name",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "total_stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
    ]
    sheriff_table_df = sheriff_df[sheriff_table_cols].copy().round(2)

    mo.vstack([sheriff_plot, sheriff_table_df])

    return


@app.cell(hide_code=True)
def police_agency_disparity_map_section_header(mo):
    """Render the section header for the police agency disparity map."""
    mo.md(r"""
    ## Police Agency Disparity Map

    This map shows stop rate disparities for police departments (excluding sheriff
    agencies) across North Carolina. Each marker is placed at the agency's
    geographic location using ACS coordinates.

    Disparity categories (relative to white drivers):
    - **Green**: ≤ 1.0 — Equity or less
    - **Yellow**: 1.0 – 2.0 — Moderate disparity
    - **Orange**: 2.0 – 3.0 — High disparity
    - **Red**: ≥ 3.0 — Severe disparity

    Use the controls below to switch between flat dots and bubbles, choose what
    the bubble size represents, and filter out low-volume agencies.
    """)
    return


@app.cell(hide_code=True)
def disparity_map_controls(mo):
    """Build controls for the police agency disparity map."""
    layout_toggle = mo.ui.radio(
        options=["Flat dots", "Bubbles"],
        value="Flat dots",
        label="Layout",
    )
    scale_toggle = mo.ui.radio(
        options=["Total Traffic Stops", "Stops of Selected Race"],
        value="Total Traffic Stops",
        label="Bubble size",
    )
    min_stops_slider = mo.ui.slider(
        start=0,
        stop=500,
        step=25,
        value=50,
        label="Minimum stops (selected race)",
    )
    return layout_toggle, min_stops_slider, scale_toggle


@app.cell
def police_agency_disparity_map(
    df_agency: pd.DataFrame,
    layout_toggle,
    min_stops_slider,
    mo,
    race_dropdown,
    scale_toggle,
    year_label,
):
    """Render a geographic map of stop rate disparities for police (non-sheriff) agencies."""
    _DISPARITY_COLORS = {
        "≤ 1.0 (Equity)": "#2ecc71",
        "1.0 - 2.0": "#f1c40f",
        "2.0 - 3.0": "#e67e22",
        "≥ 3.0 (Severe)": "#e74c3c",
    }
    _CATEGORY_ORDER = list(_DISPARITY_COLORS.keys())

    def _disparity_category(times_likely):
        if times_likely <= 1.0:
            return "≤ 1.0 (Equity)"
        elif times_likely <= 2.0:
            return "1.0 - 2.0"
        elif times_likely <= 3.0:
            return "2.0 - 3.0"
        return "≥ 3.0 (Severe)"

    _map_race = race_dropdown.value or DriverRace.BLACK.label
    _min_stops = min_stops_slider.value

    # Filter to non-sheriff police agencies with coordinates
    _police_df = df_agency[
        ~df_agency["group_name"].str.contains("Sheriff", case=False)
        & (df_agency["driver_race"] == _map_race)
        & df_agency["latitude"].notna()
        & df_agency["longitude"].notna()
        & (df_agency["stops"] >= _min_stops)
    ].copy()
    # Ensure numeric types for bubble size (ORM may return objects when year is filtered)
    _police_df["stops"] = pd.to_numeric(_police_df["stops"], errors="coerce").fillna(0).astype(int)
    _police_df["total_stops"] = (
        pd.to_numeric(_police_df["total_stops"], errors="coerce").fillna(0).astype(int)
    )

    if _police_df.empty:
        mo.stop(
            True,
            mo.callout(mo.md("No police agencies found with the current filters."), kind="warn"),
        )

    _police_df["disparity_category"] = _police_df["times_likely"].apply(_disparity_category)

    _use_bubbles = layout_toggle.value == "Bubbles"
    _size_col = "total_stops" if scale_toggle.value == "Total Traffic Stops" else "stops"

    _scatter_kwargs = dict(
        data_frame=_police_df,
        lat="latitude",
        lon="longitude",
        color="disparity_category",
        color_discrete_map=_DISPARITY_COLORS,
        category_orders={"disparity_category": _CATEGORY_ORDER},
        hover_name="group_name",
        hover_data={
            "times_likely": ":.2f",
            "stops": True,
            "total_stops": True,
            "latitude": False,
            "longitude": False,
        },
        title=f"Police Agencies: Stop Rate Disparity ({_map_race} vs. White, {year_label})",
        labels={
            "disparity_category": "Disparity",
            "stops": f"Stops ({_map_race})",
            "total_stops": "Total stops",
        },
    )
    if _use_bubbles:
        _scatter_kwargs["size"] = _size_col
        _scatter_kwargs["size_max"] = 30

    _fig_disparity = px.scatter_geo(**_scatter_kwargs)
    _fig_disparity.update_geos(
        scope="usa",
        fitbounds="locations",
        visible=True,
        showland=True,
        landcolor="#f5f5f5",
        showlakes=True,
        lakecolor="#cfe2f3",
        showsubunits=True,
        subunitcolor="#cccccc",
    )
    if not _use_bubbles:
        _fig_disparity.update_traces(marker_size=8)
    _fig_disparity.update_layout(height=650, margin={"r": 0, "t": 40, "l": 0, "b": 0})

    _table_cols = [
        "group_name",
        "driver_race",
        "population",
        "total_population",
        "stops",
        "total_stops",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
        "times_likely",
        "disparity_category",
    ]
    _disparity_table_df = _police_df[_table_cols].copy().round(2)
    mo.vstack([mo.ui.plotly(_fig_disparity), _disparity_table_df])
    return


@app.cell(hide_code=True)
def parity_section_header(mo):
    """Render the section header for the parity scatter plot."""
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
def parity_scatter_plot(df_agency: pd.DataFrame, mo, race_dropdown, year_label):
    """Compute parity data and render the population-share vs. stop-share scatter plot."""
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
        "total_stops",
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
