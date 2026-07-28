import django_filters
import numpy as np
import pandas as pd

from django.db.models import Avg, Min, Sum
from django.db.models.functions import ExtractYear
from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import STATEWIDE
from nc.models import (
    Agency,
    AgencyLikelihoodStatus,
    LikelihoodOfStopSummary,
    NCCensusProfile,
    StopSummary,
)


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
    Query LikelihoodOfStopSummary view for stop likelihood data for a specific agency.

    Results are consistent with likelihood_comparison() since both query the
    same materialized view, which uses per-year ACS population data.

    Related notebooks:
    - https://nccopwatch-share.s3.amazonaws.com/2024-04-likelihood-of-stops/likelihood-of-stops.html
    """  # noqa
    filter_set = StopSummaryFilterSet(request.GET, agency_id=agency_id)
    filter_set.is_valid()
    year = filter_set.form.cleaned_data.get("year")

    if int(agency_id) == STATEWIDE:
        qs = LikelihoodOfStopSummary.objects.filter(
            level="statewide", status=AgencyLikelihoodStatus.ACTIVE
        )
    else:
        qs = LikelihoodOfStopSummary.objects.filter(
            level="agency", group_id=str(agency_id), status=AgencyLikelihoodStatus.ACTIVE
        )

    if year:
        df = pd.DataFrame(
            qs.filter(year=int(year)).values(
                "driver_race",
                "population",
                "stops",
                "stop_rate",
                "baseline_rate",
                "stop_rate_ratio",
            )
        )
    else:
        # Average across all years, then recompute rates — same methodology as likelihood_comparison()
        agg = qs.values("driver_race").annotate(
            population=Avg("population"),
            stops=Avg("stops"),
        )
        df = pd.DataFrame(agg)
        if not df.empty:
            df["stops"] = df["stops"].astype(int)
            df["population"] = df["population"].astype(int)
            df["stop_rate"] = df["stops"] / df["population"].replace(0, np.nan)
            white_rows = df.loc[df["driver_race"] == "White", "stop_rate"]
            white_rate = white_rows.iloc[0] if not white_rows.empty else np.nan
            df["baseline_rate"] = white_rate
            df["stop_rate_ratio"] = (df["stop_rate"] - white_rate) / (white_rate or np.nan)
            df["stop_rate"] = df["stop_rate"].fillna(0)
            df["baseline_rate"] = df["baseline_rate"].fillna(0)
            df["stop_rate_ratio"] = df["stop_rate_ratio"].fillna(0)

    if df.empty:
        return pd.DataFrame(
            columns=["race", "population", "stops", "stop_rate", "baseline_rate", "stop_rate_ratio"]
        )

    df = df.rename(columns={"driver_race": "race"})

    # Sort by canonical race order
    race_order = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
    df["race_category"] = pd.Categorical(df["race"], categories=race_order, ordered=True)
    df = df.sort_values("race_category").drop(columns=["race_category"])

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
        # Extract stop_rate_ratio values (already percentage difference) as an array
        stop_percentages = chart_df["stop_rate_ratio"].round(2).tolist()
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


def available_likelihood_years() -> list[int]:
    """Return census years used by year filters and year-gating, newest first."""
    return list(
        NCCensusProfile.objects.exclude(year__isnull=True)
        .values_list("year", flat=True)
        .distinct()
        .order_by("-year")
    )


def likelihood_comparison(
    level="agency", year=None, status: str | None = AgencyLikelihoodStatus.ACTIVE
) -> pd.DataFrame:
    """
    Query LikelihoodOfStopSummary view for comparative stop likelihood data.

    Args:
        level: "agency", "county", or "statewide"
        year: optional year to filter to. If provided and not present in
            ``available_likelihood_years()``, returns an empty DataFrame.
        status: filter to rows with this status value. Pass ``None`` to return
            all rows regardless of status. Defaults to ``AgencyLikelihoodStatus.ACTIVE``.

    Returns:
        DataFrame with columns: level, group_id, group_name, census_profile_id,
        driver_race, population, total_population, stops, stop_rate,
        baseline_rate, stop_rate_ratio, times_likely, agency_name_race
    """
    qs = LikelihoodOfStopSummary.objects.filter(level=level)
    if status is not None:
        qs = qs.filter(status=status)
    if year is not None:
        if int(year) not in available_likelihood_years():
            return pd.DataFrame()
        df = pd.DataFrame(
            qs.filter(year=year).values(
                "level",
                "group_id",
                "group_name",
                "census_profile_id",
                "year",
                "driver_race",
                "population",
                "total_population",
                "stops",
                "total_stops",
                "stop_rate",
                "baseline_rate",
                "stop_rate_ratio",
                "times_likely",
                "status",
                "latitude",
                "longitude",
            )
        )
    else:
        # Aggregate across all years in the database rather than fetching every
        # per-year row and grouping in Python. This avoids transferring millions
        # of rows over the wire.
        df = pd.DataFrame(
            qs.values(
                "level", "group_id", "group_name", "census_profile_id", "driver_race", "status"
            ).annotate(
                population=Avg("population"),
                total_population=Avg("total_population"),
                stops=Avg("stops"),
                total_stops=Avg("total_stops"),
                latitude=Min("latitude"),
                longitude=Min("longitude"),
            )
        )
    if df.empty:
        return df

    if not year:
        df["stops"] = df["stops"].astype(int)
        df["total_stops"] = df["total_stops"].astype(int)
        df["population"] = df["population"].astype(int)
        df["total_population"] = df["total_population"].astype(int)
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


def parity_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute population share, stop share, and excess stops for a parity plot.

    Args:
        df: agency-level DataFrame from ``likelihood_comparison(level="agency")``,
            containing columns: group_id, group_name, driver_race, population,
            total_population, stops.

    Returns:
        DataFrame with added columns: agency_name, pop_share, stop_share,
        excess_stops (stops above parity).
    """
    if df.empty:
        return df.copy()

    total_stops = df.groupby("group_id")["stops"].transform("sum")
    out = df.copy()
    out["agency_name"] = out["group_name"]
    out["pop_share"] = out["population"] / out["total_population"].replace(0, np.nan)
    out["stop_share"] = out["stops"] / total_stops.replace(0, np.nan)
    out["excess_stops"] = out["stops"] - out["pop_share"] * total_stops
    out["pop_share"] = out["pop_share"].fillna(0)
    out["stop_share"] = out["stop_share"].fillna(0)
    out["excess_stops"] = out["excess_stops"].fillna(0)
    return out


def excluded_police_agencies(year: int = None, race: str = None) -> pd.DataFrame:
    """
    Return non-sheriff police agencies excluded from the disparity map due to
    population thresholds (status != active in LikelihoodOfStopSummary).

    Ratio metrics are still computed and available in the returned rows.

    Args:
        year: optional year to filter to. If None, averages across all years.
        race: optional driver race to filter to.

    Returns:
        DataFrame with the same columns as likelihood_comparison() plus status.
    """
    df = likelihood_comparison(level="agency", year=year, status=None)
    if df.empty:
        return df
    mask = ~df["group_name"].str.contains("Sheriff", case=False) & (
        df["status"] != AgencyLikelihoodStatus.ACTIVE
    )
    if race:
        mask = mask & (df["driver_race"] == race)
    return df[mask].reset_index(drop=True)


def active_small_population_agencies(year: int = None) -> pd.DataFrame:
    """
    Audit helper: non-sheriff agencies below the 10,000-population threshold
    (status = small_population) that are actively submitting stop data.

    Unlike ``excluded_police_agencies()``, this excludes agencies flagged only
    for ``small_race_population`` (a different exclusion reason) and keeps a
    single agency-level row (the underlying view is per-race). Only agencies
    with at least one recorded stop in the target year are returned.

    Args:
        year: year to audit. Defaults to the most recent census year from
            ``available_likelihood_years()``.

    Returns:
        DataFrame sorted by ``total_stops`` descending with columns:
        group_id, group_name, total_population, total_stops.
    """
    if year is None:
        years = available_likelihood_years()
        if not years:
            return pd.DataFrame(
                columns=["group_id", "group_name", "total_population", "total_stops"]
            )
        year = years[0]

    df = excluded_police_agencies(year=year)
    if df.empty:
        return pd.DataFrame(columns=["group_id", "group_name", "total_population", "total_stops"])

    small_pop = df[df["status"] == AgencyLikelihoodStatus.SMALL_POPULATION]
    if small_pop.empty:
        return pd.DataFrame(columns=["group_id", "group_name", "total_population", "total_stops"])

    # Collapse per-race rows to one agency-level row (population/stop totals are
    # agency-level and repeated across races).
    agencies = (
        small_pop.groupby(["group_id", "group_name"], as_index=False)
        .agg(total_population=("total_population", "max"), total_stops=("total_stops", "max"))
        .astype({"total_population": int, "total_stops": int})
    )
    agencies = agencies[agencies["total_stops"] > 0]
    return agencies.sort_values("total_stops", ascending=False).reset_index(drop=True)


def no_census_agencies() -> pd.DataFrame:
    """
    Return non-sheriff police agencies with no census profile.

    These agencies are absent from LikelihoodOfStopSummary entirely because
    there is no matching population data.

    Returns:
        DataFrame with columns: group_id, group_name, exclusion_reason.
    """
    qs = (
        Agency.objects.exclude(name__icontains="sheriff")
        .filter(census_profile_id="")
        .values("id", "name")
    )
    df = pd.DataFrame(list(qs)).rename(columns={"id": "group_id", "name": "group_name"})
    if df.empty:
        return df
    df["group_id"] = df["group_id"].astype(str)
    df["exclusion_reason"] = "No census data"
    return df.reset_index(drop=True)
