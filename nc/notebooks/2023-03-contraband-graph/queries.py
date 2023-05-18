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


colors = (
    px.colors.qualitative.Pastel2[5],  # Asian
    px.colors.qualitative.Pastel[9],  # Black
    px.colors.qualitative.Antique[2],  # Hispanic
    px.colors.qualitative.Set2[2],  # Native American
    px.colors.qualitative.Set3[2],  # Other
    px.colors.qualitative.Pastel[0],  # White
)
color_map = {
    "Asian": px.colors.qualitative.Pastel2[5],
    "Black": px.colors.qualitative.Pastel[9],
    "Hispanic": px.colors.qualitative.Antique[2],
    "Native American": px.colors.qualitative.Set2[2],
    "Other": px.colors.qualitative.Set3[2],
    "White": px.colors.qualitative.Pastel[0],
}


def lookup_agencies(agency_names, pg_conn):
    df = pd.read_sql(
        f"""
        SELECT
            id
            , name
        FROM nc_agency
        WHERE name LIKE '{list(agency_names)[0]}%%'
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
        , (CASE WHEN nc_person.gender = 'M' THEN 'male'
                WHEN nc_person.gender = 'F' THEN 'female'
        END) as driver_gender
        , (nc_search.search_id IS NOT NULL) AS driver_searched
        , (CASE
            WHEN nc_contraband.contraband_id IS NULL THEN false
            ELSE true
            END) AS contraband_found
        , (CASE WHEN nc_contraband.ounces > 0 OR nc_contraband.pounds > 0 OR nc_contraband.dosages > 0 OR nc_contraband.grams > 0 OR nc_contraband.kilos > 0 THEN true
                ELSE false
        END) AS drugs_found
        , (CASE WHEN nc_contraband.pints > 0 OR nc_contraband.gallons > 0 THEN true
                ELSE false
        END) AS alcohol_found
        , (CASE WHEN nc_contraband.weapons > 0 THEN true
                ELSE false
        END) AS weapons_found
        , (CASE WHEN nc_contraband.money > 0 THEN true
                ELSE false
        END) AS money_found
        , (CASE WHEN nc_contraband.dollar_amount > 0 THEN true
                ELSE false
        END) AS other_found
        , nc_contraband.ounces AS contraband_ounces
        , nc_contraband.pounds AS contraband_pounds
        , nc_contraband.dosages AS contraband_dosages
        , nc_contraband.grams AS contraband_grams
        , nc_contraband.kilos AS contraband_kilos
        , nc_contraband.pints AS contraband_pints
        , nc_contraband.gallons AS contraband_gallons
        , nc_contraband.weapons AS contraband_weapons
        , nc_contraband.money AS contraband_money
        , nc_contraband.dollar_amount AS contraband_dollar_amount
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


def get_current_hit_rate_graph(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH stops AS ({get_stops_summary_sql({agency_name}, pg_conn)})
        SELECT
            driver_race
            , count(*) AS stop_count
            , count(*) FILTER (WHERE driver_searched = true) AS search_count
            , count(*) FILTER (WHERE contraband_found = true) AS countraband_count
        FROM stops
        GROUP BY 1
        """,
        pg_conn.engine,
    )
    df["contraband_hit_rate"] = df.countraband_count / df.search_count
    fig = px.bar(
        df,
        x="contraband_hit_rate",
        y="driver_race",
        color="driver_race",
        color_discrete_map=color_map,
        category_orders={
            "driver_race": ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        },
        title=f"Shows what percentage of searches discovered contraband for a given race / ethnic group ({agency_name})",
        labels={
            "contraband_hit_rate": "Contraband hit rate",
            "driver_race": "Driver race",
        },
        text="contraband_hit_rate",
        text_auto=",.1%",
        range_x=[0, 1],
        orientation="h",
        height=600,
    )
    fig.update_xaxes(tickformat=",.0%")
    return fig, df


def get_figure_1(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH stops AS ({get_stops_summary_sql({agency_name}, pg_conn)})
        SELECT
            driver_race
            , stop_purpose_group
            , count(*) AS stop_count
            , count(*) FILTER (WHERE driver_searched = true) AS search_count
            , count(*) FILTER (WHERE contraband_found = true) AS countraband_count
        FROM stops
        GROUP BY 1, 2
        """,
        pg_conn.engine,
    )
    df["contraband_hit_rate"] = df.countraband_count / df.search_count
    fig = px.bar(
        df,
        x="contraband_hit_rate",
        y="driver_race",
        color="stop_purpose_group",
        color_discrete_sequence=px.colors.qualitative.Pastel1,
        title=f"Figure 1: Hit rate per search for safety, regulatory, and investigatory-related stop purposes ({agency_name})",
        labels={
            "contraband_hit_rate": "Contraband hit rate",
            "driver_race": "Driver race",
            "stop_purpose_group": "Stop purpose",
        },
        text="contraband_hit_rate",
        text_auto=",.1%",
        range_x=[0, 1],
        orientation="h",
        height=600,
        barmode="group",
    )
    fig.update_xaxes(tickformat=",.0%")
    return fig, df


def get_figure_2(agency_name, pg_conn):
    df = pd.read_sql(
        f"""
        WITH stops AS ({get_stops_summary_sql({agency_name}, pg_conn)})
        SELECT
            driver_race
            , stop_purpose_group
            , count(*) AS stop_count
            , count(*) FILTER (WHERE driver_searched = true) AS search_count
            , count(*) FILTER (WHERE drugs_found = true) AS drug_count
            , count(*) FILTER (WHERE alcohol_found = true) AS alcohol_count
            , count(*) FILTER (WHERE weapons_found = true) AS weapon_count
            , count(*) FILTER (WHERE money_found = true) AS money_count
            , count(*) FILTER (WHERE other_found = true) AS other_count
        FROM stops
        GROUP BY 1, 2
        """,
        pg_conn.engine,
    )
    df["Drugs"] = df.drug_count / df.search_count
    df["Alcohol"] = df.alcohol_count / df.search_count
    df["Weapons"] = df.weapon_count / df.search_count
    df["Money"] = df.money_count / df.search_count
    df["Other"] = df.other_count / df.search_count
    fig = px.bar(
        df.melt(
            id_vars=["driver_race", "stop_purpose_group"],
            value_vars=["Drugs", "Alcohol", "Weapons", "Money", "Other"],
            var_name="contraband_type",
            value_name="hit_rate",
        ),
        x="hit_rate",
        y="driver_race",
        color="contraband_type",
        color_discrete_sequence=px.colors.qualitative.Pastel1,
        category_orders={
            "driver_race": ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        },
        title=f"Figure 2: Hit rate per search by contraband type, for safety, regulatory, and investigatory-related stop purposes ({agency_name})",
        labels={
            "contraband_type": "Contraband type",
            "driver_race": "Driver race",
            "stop_purpose_group": "Stop purpose",
            "hit_rate": "Hit rate per search",
        },
        text="hit_rate",
        text_auto=",.0%",
        orientation="h",
        height=600,
        barmode="relative",
        facet_col="stop_purpose_group",
    )
    fig.update_xaxes(tickformat=",.0%")
    return fig, df
