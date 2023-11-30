import pandas as pd

from django.db.models import Count, Q
from django.db.models.functions import ExtractYear

from nc.models import ContrabandSummary


def contraband_query(agency_id=None, officer_id=None, group_by=None, debug=False):
    """
    Query ContrabandSummary materialized view for aggregate contraband
    statistics.

    Depending on `group_by`, returns a long-format DataFrame roughly like this:

            driver_race  year  search_count  contraband_found_count
        0         Asian  2002             8                       0
        1         Asian  2003             1                       0
        2         Asian  2004             1                       0
        3         Asian  2006             7                       2
        4         Asian  2007            17                       4
        ..          ...   ...           ...                     ...
        116       White  2019            75                      24
        117       White  2020            45                      22
        118       White  2021            44                      22
        119       White  2022            51                      15
        120       White  2023            28                      11
    """
    search = Q(agency_id=agency_id) if agency_id else Q()
    if officer_id:
        search &= Q(officer_id=officer_id)
    search &= Q(driver_searched=True)
    # Always group by year for table
    year_group_by = group_by.copy()
    year_group_by.add("year")
    qs = (
        ContrabandSummary.objects.filter(search)
        .annotate(year=ExtractYear("date"))
        .values(*year_group_by)
        .annotate(
            search_count=Count("search_id", distinct=True),
            contraband_found_count=Count(
                "contraband_id", distinct=True, filter=Q(contraband_found=True)
            ),
        )
    )
    if debug:
        print(qs.explain(analyze=True, verbose=True))
    return pd.DataFrame(qs)


def hit_rate_chart(query_df: pd.DataFrame, group_by: set):
    """
    Calculate th contraband "hit rate" aggregated within `group_by` columns.
    """
    # First aggregate search and contraband counts within `group_by` columns,
    # for example by driver_race:
    #
    #           driver_race  search_count  contraband_found_count
    #    0            Asian            84                      17
    #    1            Black         18253                    5049
    #    2         Hispanic          2569                     440
    #    3  Native American            30                       7
    #    4            Other            49                      12
    #    5            White          2492                     533
    #
    df = (
        query_df.groupby(*group_by)[["search_count", "contraband_found_count"]]
        .agg("sum")
        .reset_index()
    )
    # Calculate the "hit rate" for each grouping:
    #
    #           driver_race  search_count  contraband_found_count   hit_rate
    #    0            Asian            84                      17  20.238095
    #    1            Black         18253                    5049  27.661206
    #    2         Hispanic          2569                     440  17.127287
    #    3  Native American            30                       7  23.333333
    #    4            Other            49                      12  24.489796
    #    5            White          2492                     533  21.388443
    #
    df["hit_rate"] = df.contraband_found_count / df.search_count * 100
    # Pivot to a wide-format DataFrame along group_by columns:
    #
    #    driver_race  Asian  Black  Hispanic  Native American  Other  White
    #    hit_rate     20.24  27.66     17.13            23.33  24.49  21.39
    #
    table = df.round(2).pivot_table(columns=group_by, values=["hit_rate"])
    # Return formated as dict like {column -> [values]}
    #
    #   {'Asian': [20.24],
    #    'Black': [27.66],
    #    'Hispanic': [17.13],
    #    'Native American': [23.33],
    #    'Other': [24.49],
    #    'White': [21.39]}
    #
    return table.to_dict("list")


def hit_rate_table(query_df: pd.DataFrame, group_by: set):
    """Return hit rate data table to support chart calculations"""
    # Pivot to a wide-format DataFrame along year and group_by columns:
    #
    #    driver_race  Asian  Black  Hispanic  Native American  Other  White
    #    year
    #    2002             0    193        37                0      3     33
    #    2003             0    103        15                0      0     25
    #    2004             0     89        11                1      0     24
    #    2005             0     83        12                0      0     14
    #    2006             2    130        16                0      1     23
    #
    df = query_df.pivot_table(
        index="year", columns=group_by, values="contraband_found_count", fill_value=0
    ).astype("Int64")

    table = {"labels": list(df.index), "datasets": []}
    # Perform a column-wise traversal to build a {"label": label, "data": [v1, v2, ...]}
    for label, values in df.to_dict("list").items():
        table["datasets"].append({"label": label, "data": values})
    # Return dataset dict for easy parsing:
    #    {'labels': [2020, 2021, 2022, 2023],
    #     'datasets': [{'label': 'Asian', 'data': [1, 1, 1, 1]},
    #                  {'label': 'Black', 'data': [219, 308, 534, 336]},
    #                  {'label': 'Hispanic', 'data': [14, 20, 46, 39]},
    #                  {'label': 'Native American', 'data': [1, 1, 0, 0]},
    #                  {'label': 'Other', 'data': [0, 1, 0, 1]},
    #                  {'label': 'White', 'data': [22, 22, 15, 11]}]}
    return table
