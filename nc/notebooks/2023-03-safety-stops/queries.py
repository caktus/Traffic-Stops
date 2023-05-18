# flake8: noqa
from enum import Enum

import pandas as pd
import plotly.express as px
import requests


class StopPurpose(Enum):
    SPEED_LIMIT_VIOLATION = 1  # Safety Violation
    STOP_LIGHT_SIGN_VIOLATION = 2  # Safety Violation
    DRIVING_WHILE_IMPAIRED = 3  # Safety Violation
    SAFE_MOVEMENT_VIOLATION = 4  # Safety Violation
    VEHICLE_EQUIPMENT_VIOLATION = 5  # Regulatory and Equipment
    VEHICLE_REGULATORY_VIOLATION = 6  # Regulatory and Equipment
    OTHER_MOTOR_VEHICLE_VIOLATION = 9  # Regulatory and Equipment
    SEAT_BELT_VIOLATION = 7  # Investigatory
    INVESTIGATION = 8  # Investigatory
    CHECKPOINT = 10  # Investigatory

    @classmethod
    def safety_violation(cls):
        return [
            cls.SPEED_LIMIT_VIOLATION.value,
            cls.STOP_LIGHT_SIGN_VIOLATION.value,
            cls.DRIVING_WHILE_IMPAIRED.value,
            cls.SAFE_MOVEMENT_VIOLATION.value,
        ]

    @classmethod
    def regulatory_equipment(cls):
        return [
            cls.VEHICLE_EQUIPMENT_VIOLATION.value,
            cls.VEHICLE_REGULATORY_VIOLATION.value,
            cls.OTHER_MOTOR_VEHICLE_VIOLATION.value,
        ]

    @classmethod
    def investigatory(cls):
        return [cls.SEAT_BELT_VIOLATION.value, cls.INVESTIGATION.value, cls.CHECKPOINT.value]


def lookup_agencies(agency_names, pg_conn):
    df = pd.read_sql(
        f"""
        SELECT
            id
            , name
        FROM nc_agency
        WHERE name ~ '{"|".join(agency_names)}'
        ORDER BY 2
        """,
        pg_conn,
    )
    return df["id"].tolist()


def get_stops_summary_sql(agency_names, pg_conn):
    agency_ids = lookup_agencies(agency_names, pg_conn)
    return f"""
    SELECT
        nc_stop.stop_id
        , date AT TIME ZONE 'America/New_York' AS stop_date
        , EXTRACT(hour FROM date AT TIME ZONE 'America/New_York') AS "hour_of_day"
        , nc_stop.agency_id
        , nc_stop.agency_description AS agency
        , nc_stop.officer_id
        , (CASE WHEN nc_stop.purpose IN ({",".join(map(str, StopPurpose.safety_violation()))}) THEN 'Safety Violation'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurpose.investigatory()))}) THEN 'Investigatory'
                WHEN nc_stop.purpose IN ({",".join(map(str, StopPurpose.regulatory_equipment()))}) THEN 'Regulatory and Equipment'
                ELSE 'Other'
        END) as stop_purpose_group
        , (CASE WHEN nc_person.ethnicity = 'H' THEN 'Hispanic'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'A' THEN 'Asian'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'B' THEN 'Black'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'I' THEN 'Native American'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'U' THEN 'Other'
                WHEN nc_person.ethnicity = 'N' AND nc_person.race = 'W' THEN 'White'
        END) as driver_race
        , (CASE WHEN nc_person.gender = 'M' THEN 'Male'
                WHEN nc_person.gender = 'F' THEN 'Female'
        END) as driver_gender
        , (nc_search.search_id IS NOT NULL) AS driver_searched
        , (CASE
            WHEN nc_contraband.contraband_id IS NULL THEN false
            ELSE true
            END) AS contraband_found
        , driver_arrest
    FROM "nc_stop"
    INNER JOIN "nc_person"
        ON ("nc_stop"."stop_id" = "nc_person"."stop_id" AND "nc_person"."type" = 'D')
    LEFT OUTER JOIN "nc_search"
        ON ("nc_stop"."stop_id" = "nc_search"."stop_id")
    LEFT OUTER JOIN "nc_contraband"
        ON ("nc_stop"."stop_id" = "nc_contraband"."stop_id")
    WHERE nc_stop.agency_id IN ({",".join(map(str, agency_ids))})
    """


def get_day_night_stop_purpose_group(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH
            stops AS ({get_stops_summary_sql({agency_name}, pg_conn)}),
            day_stops AS (
                SELECT
                    driver_race
                    , driver_gender
                    , stop_purpose_group
                    , (CASE WHEN stop_purpose_group = 'Regulatory and Equipment' THEN 1
                            WHEN stop_purpose_group = 'Safety Violation' THEN 2
                            WHEN stop_purpose_group = 'Investigatory' THEN 3
                    END) as stop_purpose_group_order
                    , (CASE WHEN hour_of_day BETWEEN 5 AND 16 THEN 'Day (5am to 5pm)'
                            WHEN (hour_of_day >= 17 OR hour_of_day <= 4) THEN 'Night (5pm to 5am)'
                            ELSE 'Missing'
                    END) as day_part
                FROM stops
            )
        SELECT
            driver_race
            , driver_gender
            , stop_purpose_group
            , stop_purpose_group_order
            , day_part
            , count(*) AS stop_count
            , sum(count(*)) OVER (PARTITION BY driver_race, driver_gender, day_part)::integer AS total_group_stops_by_race
        FROM day_stops
        GROUP BY 1, 2, 3, 4, 5
        """,
        pg_conn.engine,
    )
    df["percent_stops_for_race"] = df.stop_count / df.total_group_stops_by_race
    fig = px.bar(
        df.sort_values(
            ["stop_purpose_group_order", "percent_stops_for_race"], ascending=[True, False]
        ),
        x="driver_race",
        y="percent_stops_for_race",
        color="stop_purpose_group",
        title=f"Percent of stops by stop purpose group, by time of day, by gender, by race, {agency_name}, 2002-2022",
        labels={
            "percent_stops_for_race": "Percent of stops",
            "driver_race": "Driver race",
            "stop_purpose_group": "Stop purpose group",
            "male": "Male",
        },
        color_discrete_sequence=px.colors.qualitative.Vivid,
        height=600,
        facet_row="driver_gender",
        facet_col="day_part",
        category_orders={"day_part": ["Day (5am to 5pm)", "Night (5pm to 5am)"]},
    )
    fig.update_yaxes(tickformat=",.0%")
    return fig


def get_black_white_safety_stops(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH stops AS ({get_stops_summary_sql({agency_name}, pg_conn)})
        SELECT
            hour_of_day
            , stop_purpose_group
            , driver_race
            , driver_gender
            , count(*) AS stop_count
            , sum(count(*)) OVER (PARTITION BY hour_of_day, driver_race, driver_gender)::integer AS total_hour_stops_by_race
        FROM stops
        GROUP BY 1, 2, 3, 4
        """,
        pg_conn.engine,
    )
    df["percent_stops_for_race_gender"] = df.stop_count / df.total_hour_stops_by_race
    mask = (df["stop_purpose_group"] == "Safety Violation") & (
        df["driver_race"].isin(["Black", "White"])
    )
    fig = px.line(
        df[mask],
        x="hour_of_day",
        y="percent_stops_for_race_gender",
        color="driver_race",
        title=f"Percent of stops for safety-related purposes, by race, gender, and hour of day, {agency_name}, 2002-2022",
        labels={
            "percent_stops_for_race_gender": "Percent of stops for safety-related purposes",
            "hour_of_day": "Hour of day",
            "driver_race": "Driver race",
            "driver_gender": "Driver gender",
        },
        color_discrete_sequence=(px.colors.diverging.Picnic[1], px.colors.diverging.Picnic[7]),
        height=600,
        markers=True,
        line_dash="driver_gender",
        line_dash_map={"Male": "solid", "Female": "dot"},
        line_group="driver_gender",
    )
    fig.layout.yaxis.tickformat = ",.0%"
    fig.update_traces(textposition="bottom right")
    return fig, df


def fig_percent_traffic_stops(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH stops AS ({get_stops_summary_sql({agency_name}, pg_conn)})
        SELECT
            hour_of_day
            , driver_race
            , driver_gender
            , count(*) AS stop_count
            , sum(count(*)) OVER (PARTITION BY hour_of_day)::integer AS total_hour_stops
        FROM stops
        GROUP BY 1, 2, 3
        """,
        pg_conn.engine,
    )
    df["percent_stops_for_race_gender"] = df.stop_count / df.total_hour_stops
    mask = df["driver_race"].isin(["Black", "White"])
    fig = px.line(
        df[mask],
        x="hour_of_day",
        y="percent_stops_for_race_gender",
        color="driver_race",
        title=f"Percent of traffic stops by race, gender, and hour of day, {agency_name}, 2002-2022",
        labels={
            "percent_stops_for_race_gender": "Percent of stops",
            "hour_of_day": "Hour of day",
            "driver_race": "Driver race",
            "driver_gender": "Driver gender",
        },
        color_discrete_sequence=(px.colors.diverging.Picnic[1], px.colors.diverging.Picnic[7]),
        height=600,
        markers=True,
        line_dash="driver_gender",
        line_dash_map={"Male": "solid", "Female": "dot"},
        line_group="driver_gender",
    )
    fig.layout.yaxis.tickformat = ",.0%"
    fig.update_traces(textposition="bottom right")
    return fig, df


def get_census_data(location, geography):
    acs = requests.get("https://nccopwatch.s3.us-east-2.amazonaws.com/acs-2021.json").json()
    for entry in acs:
        if entry["geography"] == geography and location in entry["location"]:
            break
    df = pd.DataFrame.from_dict([entry])
    df = df.melt(
        value_vars=[
            "black",
            "white",
            "native_american",
            "asian",
            "native_hawaiian",
            "hispanic",
            "other",
            "two_or_more_races",
        ],
        var_name="Driver race",
        value_name="count",
    )
    df["Driver race"] = df["Driver race"].str.replace("_", " ")
    df["Driver race"] = df["Driver race"].str.title()
    fig = px.pie(
        df.sort_values("count", ascending=False),
        values="count",
        names="Driver race",
        title=f"{entry['location']} {entry['source']}",
        category_orders={"Driver race": ["White", "Black"]},
        color_discrete_sequence=[px.colors.diverging.Picnic[7], px.colors.diverging.Picnic[1]]
        + px.colors.qualitative.Vivid,
        height=500,
    )
    fig.update_traces(textposition="inside", textinfo="percent+label")
    return fig
