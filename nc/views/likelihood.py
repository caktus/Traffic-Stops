import django_filters
import pandas as pd

from django.db.models import Avg, Sum
from django.db.models.functions import ExtractYear
from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import STATEWIDE
from nc.models import Agency, NCCensusProfile, StopSummary


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
    # Calculate rates
    df["stop_rate"] = df["stops"] / df["population"]
    df["baseline_rate"] = df[df["race"] == "White"]["stop_rate"].iloc[0]
    df["stop_rate_ratio"] = df["stop_rate"] / df["baseline_rate"]
    df.fillna(0, inplace=True)
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
        return Response(data=data, status=200)
