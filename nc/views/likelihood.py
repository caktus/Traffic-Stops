import django_filters
import numpy as np
import pandas as pd

from django.db.models import Avg, Sum
from django.db.models.functions import ExtractYear
from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import STATEWIDE
from nc.models import Agency, LikelihoodOfStopSummary, NCCensusProfile, StopSummary


class StopSummaryFilterSet(django_filters.FilterSet):
    """FilterSet for StopSummary arrest and stop data"""

    year = django_filters.NumberFilter(field_name="year")
    officer = django_filters.CharFilter(field_name="officer_id")

    class Meta:
        model = StopSummary
        fields = ("stop_purpose",)

    def __init__(self, *args, **kwargs):
        self.agency_id = kwargs.pop("agency_id")
        super().__init__(*args, **kwargs)

    @property
    def qs(self):
        self.queryset = StopSummary.objects.annotate(year=ExtractYear("date"))
        qs = super().qs
        if int(self.agency_id) != STATEWIDE:
            qs = qs.filter(agency_id=self.agency_id)
        return qs


def get_acs_population_data(acs_id: str, year: int = None) -> pd.DataFrame:
    """
    Return ACS population data by race for a given acs_id and optional year. If
    no year is provided, return the average population for the acs_id.
    """
    qs = NCCensusProfile.objects.filter(acs_id=acs_id)
    if year:
        qs = qs.filter(year=year).values("race", "population")
    else:
        # Get the average population for the acs_id
        qs = qs.values("race").annotate(population=Avg("population"))
    if not qs.exists():
        # Create empty DF with expected column names
        qs = pd.DataFrame(qs, columns=["race", "population"])
    return pd.DataFrame(qs)


def get_stop_count_data(filter_set: StopSummaryFilterSet) -> pd.DataFrame:
    """
    Return total stops
    """
    by_year = bool(filter_set.form.cleaned_data.get("year"))
    # Group by race AND year if we're not limiting by year, so we can
    # calculate the mean of the yearly stops. Otherwise, just group by
    # race to get the total stops that year.
    group_by = ("driver_race_comb",) if by_year else ("driver_race_comb", "year")
    # Sum stops across the selected grouping, used for the denominator
    # in the stop rate calculation.
    qs = filter_set.qs.values(*group_by).annotate(stops=Sum("count"))
    df = pd.DataFrame(qs)
    if df.empty:
        # Create empty DF with expected column names
        df = pd.DataFrame(
            qs, columns=list(qs.query.values_select) + list(qs.query.annotation_select)
        )
    if not by_year:
        # If not grouping by year, we need to calculate the mean of the yearly
        # stops for each race. Django doesn't allow aggregating an annotated
        # field, so just use Pandas to calculate the mean.
        df = df.groupby("driver_race_comb").agg({"stops": "mean"}).reset_index()
    # Add a column for the total stops
    df["stops_total"] = df["stops"].sum()
    return df


def likelihood_stop_query(request, agency_id, debug=True):
    """
    Query LikelihoodStopSummary view for stop likelihood data.

    Related notebooks:
    - https://nccopwatch-share.s3.amazonaws.com/2024-04-likelihood-of-stops/likelihood-of-stops.html
    """  # noqa
    # Build query to filter down queryset
    filter_set = StopSummaryFilterSet(request.GET, agency_id=agency_id)
    filter_set.is_valid()
    # Perform query with SQL aggregations
    df = get_stop_count_data(filter_set=filter_set)
    # Merge with ACS data
    agency = Agency.objects.get(id=agency_id)
    df_acs = get_acs_population_data(
        acs_id=agency.census_profile_id, year=filter_set.form.cleaned_data["year"]
    )
    df = df.merge(
        right=df_acs[["race", "population"]],
        left_on="driver_race_comb",
        right_on="race",
    )
    if not df_acs.empty:
        # Calculate rates
        # If stops is non-zero and population is 0 for a race, its stop_rate will
        # be Infinity, which will cause a ValueError when serializing to JSON.
        # Update it to 0 in such cases
        df["stop_rate"] = (df["stops"] / df["population"]).replace(np.inf, 0)
        df["baseline_rate"] = df[df["race"] == "White"]["stop_rate"].iloc[0]
        df["stop_rate_ratio"] = df["stop_rate"] / df["baseline_rate"]
    else:
        # If no ACS data, chart will be empty
        df["stop_rate"] = 0.0
        df["baseline_rate"] = 0.0
        df["stop_rate_ratio"] = 0.0

    # Ensure numeric columns are properly typed
    df["stop_rate"] = pd.to_numeric(df["stop_rate"], errors="coerce").fillna(0)
    df["baseline_rate"] = pd.to_numeric(df["baseline_rate"], errors="coerce").fillna(0)
    df["stop_rate_ratio"] = pd.to_numeric(df["stop_rate_ratio"], errors="coerce").fillna(0)
    df.rename(columns={"driver_race_comb": "driver_race"}, inplace=True)

    # Ensure driver_race column follows this order
    race_order = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
    df["driver_race_category"] = pd.Categorical(df["driver_race"], categories=race_order)
    df.sort_values("driver_race_category", inplace=True)
    df = df.drop(columns=["driver_race_category"])

    # Reorder columns
    df = df[["race", "population", "stops", "stop_rate", "baseline_rate", "stop_rate_ratio"]].copy()

    if debug:
        print(df)

    return df


class LikelihoodStopView(APIView):
    """Comparison of Population to Traffic Stops"""

    def get(self, request, agency_id):
        # Build chart and table data
        df = likelihood_stop_query(request=request, agency_id=agency_id, debug=False)
        # Don't include White stops in the chart
        chart_df = df[df["race"] != "White"].copy()
        # Extract only stop_rate_ratio values as an array
        stop_percentages = (chart_df["stop_rate_ratio"] - 1).round(2).tolist()
        # Prepare table data
        table_data = df.copy()
        table_data["population"] = table_data["population"].astype(int)
        table_data["stops"] = table_data["stops"].astype(int)
        # Multiply rates by 100 for ease of interpretation
        table_data["stop_rate"] = (table_data["stop_rate"] * 100).round(2)
        table_data["baseline_rate"] = (table_data["baseline_rate"] * 100).round(2)
        table_data["stop_rate_ratio"] = table_data["stop_rate_ratio"].round(2)

        data = {
            "stop_percentages": stop_percentages,
            "table_data": table_data.to_dict(orient="records"),
        }

        if stop_percentages and len(stop_percentages) < 5:
            # We have stop percentages, but not for all races. Add the list of
            # races with stop percentages to the response, so we'll know which
            # ones to display in the chart on the frontend
            data["stop_percentages_races"] = chart_df["race"]

        return Response(data=data, status=200)


def likelihood_comparison(level="agency", year=None):
    """
    Query LikelihoodOfStopSummary view for comparative stop likelihood data.

    Args:
        level: "agency" or "county"
        year: optional year to filter to

    Returns:
        DataFrame with columns: level, group_id, group_name, census_profile_id,
        driver_race, population, total_population, stops, stop_rate,
        baseline_rate, stop_rate_ratio, times_likely, agency_name_race
    """
    qs = LikelihoodOfStopSummary.objects.filter(level=level)
    if year:
        qs = qs.filter(year=year)
    df = pd.DataFrame(
        qs.values(
            "level",
            "group_id",
            "group_name",
            "census_profile_id",
            "year",
            "driver_race",
            "population",
            "total_population",
            "stops",
            "stop_rate",
            "baseline_rate",
            "stop_rate_ratio",
            "times_likely",
        )
    )
    if df.empty:
        return df

    if not year:
        # Average across years to match the original notebook behavior
        df = (
            df.groupby(["level", "group_id", "group_name", "census_profile_id", "driver_race"])
            .agg({"population": "first", "total_population": "first", "stops": "mean"})
            .reset_index()
        )
        df["stops"] = df["stops"].astype(int)
        df["stop_rate"] = df["stops"] / df["population"].replace(0, np.nan)
        # Recompute baseline from White stop rate per group
        white = df[df["driver_race"] == "White"][["group_id", "stop_rate"]].rename(
            columns={"stop_rate": "baseline_rate"}
        )
        df = df.merge(white, on="group_id", how="left")
        df["stop_rate_ratio"] = (df["stop_rate"] - df["baseline_rate"]) / df[
            "baseline_rate"
        ].replace(0, np.nan)
        df["times_likely"] = (df["stop_rate"] / df["baseline_rate"].replace(0, np.nan)).abs()
        df["stop_rate"] = df["stop_rate"].fillna(0)
        df["baseline_rate"] = df["baseline_rate"].fillna(0)
        df["stop_rate_ratio"] = df["stop_rate_ratio"].fillna(0)
        df["times_likely"] = df["times_likely"].fillna(0)

    df["agency_name_race"] = df["group_name"] + " - " + df["driver_race"]
    return df.sort_values("times_likely", ascending=False).reset_index(drop=True)


def county_agency_labels(race: str, year: int = None, top_n: int = 3) -> pd.Series:
    """
    Return a Series mapping county 5-digit FIPS → top-N agency label string.

    Useful for enriching county choropleth hover data with contributing agency context.

    Args:
        race: driver race (e.g. "Black", "Hispanic")
        year: optional year filter; None averages across all years
        top_n: number of top agencies (by stops) to show per county

    Returns:
        pd.Series indexed by county 5-digit FIPS (e.g. "37063") with values like
        "Durham PD: 2.5x<br>Chapel Hill PD: 2.1x"
    """
    from nc.models import Agency

    df_agency = likelihood_comparison(level="agency", year=year)
    if df_agency.empty:
        return pd.Series(dtype=str)

    df_race = df_agency[df_agency["driver_race"] == race].copy()
    if df_race.empty:
        return pd.Series(dtype=str)

    agency_county = pd.DataFrame(Agency.objects.exclude(county_id=None).values("id", "county_id"))
    if agency_county.empty:
        return pd.Series(dtype=str)

    agency_county["id"] = agency_county["id"].astype(str)
    df_race = df_race.merge(agency_county, left_on="group_id", right_on="id", how="left")
    df_race = df_race.dropna(subset=["county_id"])

    result = {}
    for county_id, grp in df_race.groupby("county_id"):
        top = grp.nlargest(top_n, "stops")
        lines = [f"{row['group_name']}: {row['times_likely']:.1f}x" for _, row in top.iterrows()]
        result[county_id] = "<br>".join(lines)

    return pd.Series(result)
