import django_filters
import numpy as np
import pandas as pd

from django.db.models import Avg, Min, Q
from django.db.models.functions import ExtractYear
from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import STATEWIDE
from nc.models import (
    Agency,
    AgencyLikelihoodStatus,
    DriverRace,
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


def likelihood_stop_query(request, agency_id, debug=True):
    """
    Query LikelihoodOfStopSummary view for stop likelihood data for a specific agency.

    Results are consistent with likelihood_comparison() since both query the
    same materialized view, which uses per-year ACS population data.

    Related notebooks:
    - https://nccopwatch-share.s3.amazonaws.com/2024-04-likelihood-of-stops/likelihood-of-stops.html
    """
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
    level="agency",
    year=None,
    status: str | None = AgencyLikelihoodStatus.ACTIVE,
    query: Q | None = None,
) -> pd.DataFrame:
    """
    Query LikelihoodOfStopSummary view for comparative stop likelihood data.

    Args:
        level: "agency", "county", or "statewide"
        year: optional year to filter to. If provided and not present in
            ``available_likelihood_years()``, returns an empty DataFrame.
        status: filter to rows with this status value. Pass ``None`` to return
            all rows regardless of status. Defaults to ``AgencyLikelihoodStatus.ACTIVE``.
        query: optional ``Q`` object applied to the base queryset for additional
            DB-level filtering (e.g. ``~Q(group_name__icontains="Sheriff")``). It is
            applied to both the year and no-year branches. Do **not** filter on
            ``driver_race`` here for the no-year path: that branch recomputes
            ``baseline_rate`` by merging each group's White row, so removing White
            rows at the DB level would break the baseline calculation. Filter race
            in Pandas after this function returns instead.

    Returns:
        DataFrame with columns: level, group_id, group_name, census_profile_id,
        driver_race, population, total_population, stops, stop_rate,
        baseline_rate, stop_rate_ratio, times_likely, agency_name_race
    """
    qs = LikelihoodOfStopSummary.objects.filter(level=level)
    if status is not None:
        qs = qs.filter(status=status)
    if query is not None:
        qs = qs.filter(query)
    if year is not None:
        if int(year) not in available_likelihood_years():
            return pd.DataFrame()
        qs = qs.filter(year=year).values(
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
        df = pd.DataFrame(qs, columns=list(qs.query.values_select))
    else:
        # Aggregate across all years in the database rather than fetching every
        # per-year row and grouping in Python. This avoids transferring millions
        # of rows over the wire.
        qs = qs.values(
            "level", "group_id", "group_name", "census_profile_id", "driver_race", "status"
        ).annotate(
            population=Avg("population"),
            total_population=Avg("total_population"),
            stops=Avg("stops"),
            total_stops=Avg("total_stops"),
            latitude=Min("latitude"),
            longitude=Min("longitude"),
        )
        df = pd.DataFrame(
            qs, columns=list(qs.query.values_select) + list(qs.query.annotation_select)
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
    df = likelihood_comparison(
        level="agency",
        year=year,
        status=None,
        query=~Q(group_name__icontains="Sheriff") & ~Q(status=AgencyLikelihoodStatus.ACTIVE),
    )
    if df.empty:
        return df
    if race:
        df = df[df["driver_race"] == race]
    return df.reset_index(drop=True)


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

    df = likelihood_comparison(
        level="agency",
        year=year,
        status=None,
        query=~Q(group_name__icontains="Sheriff")
        & Q(status=AgencyLikelihoodStatus.SMALL_POPULATION),
    )
    if df.empty:
        return pd.DataFrame(columns=["group_id", "group_name", "total_population", "total_stops"])

    # Collapse per-race rows to one agency-level row (population/stop totals are
    # agency-level and repeated across races).
    agencies = (
        df.groupby(["group_id", "group_name"], as_index=False)
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


# --- Agency-Level Stop Disparities dashboard API ------------------------------

# Disparity color categories keyed on times_likely, mirroring the notebook.
DISPARITY_COLORS = {
    "≤ 1.0 (Equity)": "#2ecc71",
    "1.0 - 2.0": "#f1c40f",
    "2.0 - 3.0": "#e67e22",
    "≥ 3.0 (Severe)": "#e74c3c",
}


def disparity_category(times_likely: float) -> str:
    """Bucket a ``times_likely`` value into a disparity category label."""
    if times_likely <= 1.0:
        return "≤ 1.0 (Equity)"
    elif times_likely <= 2.0:
        return "1.0 - 2.0"
    elif times_likely <= 3.0:
        return "2.0 - 3.0"
    return "≥ 3.0 (Severe)"


def _clean_year(request) -> int | None:
    """Return the ``year`` query param as an int, or None when absent/invalid."""
    year = request.query_params.get("year")
    return int(year) if year and year.isdigit() else None


def _selected_race(request) -> str:
    """Return the ``race`` query param, defaulting to Black."""
    return request.query_params.get("race") or DriverRace.BLACK.label


class DisparityYearsView(APIView):
    """Census years available for the disparities dashboard filters."""

    def get(self, request):
        return Response({"years": available_likelihood_years()})


class TopAgenciesView(APIView):
    """Top-N agencies where the selected race is most likely to be stopped."""

    def get(self, request):
        year = _clean_year(request)
        race = _selected_race(request)
        limit = request.query_params.get("limit")
        df = likelihood_comparison(level="agency", year=year)
        records = []
        if not df.empty:
            df = df[df["driver_race"] == race]
            if limit and limit.isdigit():
                df = df.head(int(limit))
            cols = [
                "group_id",
                "group_name",
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
            records = df[cols].round(2).to_dict(orient="records")
        return Response({"race": race, "year": year, "agencies": records})


class SheriffDisparityView(APIView):
    """Sheriff agency stop-rate ratios by county for the county choropleth."""

    def get(self, request):
        year = _clean_year(request)
        race = _selected_race(request)
        df = likelihood_comparison(
            level="agency",
            year=year,
            status=None,
            query=Q(group_name__icontains="Sheriff"),
        )
        records = []
        if not df.empty:
            df = df[df["driver_race"] == race].copy()
            df["fips3"] = df["census_profile_id"].str[-3:]
            cols = [
                "group_id",
                "group_name",
                "fips3",
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
            ]
            records = df[cols].round(2).to_dict(orient="records")
        return Response({"race": race, "year": year, "sheriffs": records})


class PoliceDisparityView(APIView):
    """Non-sheriff police agencies with coordinates for the bubble map."""

    min_stops = 100

    def get(self, request):
        year = _clean_year(request)
        race = _selected_race(request)
        df = likelihood_comparison(level="agency", year=year)
        records = []
        if not df.empty:
            police = df[
                ~df["group_name"].str.contains("Sheriff", case=False)
                & (df["driver_race"] == race)
                & df["latitude"].notna()
                & df["longitude"].notna()
            ].copy()
            police["stops"] = pd.to_numeric(police["stops"], errors="coerce").fillna(0).astype(int)
            police["total_stops"] = (
                pd.to_numeric(police["total_stops"], errors="coerce").fillna(0).astype(int)
            )
            police = police[police["stops"] >= self.min_stops].copy()
            police["disparity_category"] = police["times_likely"].apply(disparity_category)
            police["small_population"] = False
            frames = [police]
            # Sub-threshold (< 10,000 population) agencies that voluntarily report.
            excluded = excluded_police_agencies(year=year, race=race)
            if not excluded.empty:
                small = excluded[
                    (excluded["status"] == AgencyLikelihoodStatus.SMALL_POPULATION)
                    & excluded["latitude"].notna()
                    & excluded["longitude"].notna()
                ].copy()
                small["stops"] = (
                    pd.to_numeric(small["stops"], errors="coerce").fillna(0).astype(int)
                )
                small["total_stops"] = (
                    pd.to_numeric(small["total_stops"], errors="coerce").fillna(0).astype(int)
                )
                small = small[small["stops"] >= self.min_stops].copy()
                if not small.empty:
                    small["disparity_category"] = small["times_likely"].apply(disparity_category)
                    small["small_population"] = True
                    frames.append(small)
            combined = pd.concat(frames, ignore_index=True)
            cols = [
                "group_id",
                "group_name",
                "latitude",
                "longitude",
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
                "small_population",
            ]
            records = combined[cols].round(2).to_dict(orient="records")
        return Response({"race": race, "year": year, "agencies": records})


class ParityView(APIView):
    """Population share vs. stop share for the parity scatter plot."""

    def get(self, request):
        year = _clean_year(request)
        race = _selected_race(request)
        df = likelihood_comparison(level="agency", year=year)
        records = []
        if not df.empty:
            parity = parity_data(df)
            races = {race, DriverRace.WHITE.label}
            parity = parity[parity["driver_race"].isin(races)]
            cols = [
                "group_id",
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
            records = parity[cols].round(4).to_dict(orient="records")
        return Response({"race": race, "year": year, "agencies": records})
