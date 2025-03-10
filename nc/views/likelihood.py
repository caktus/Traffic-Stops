import django_filters
import pandas as pd

from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import STATEWIDE
from nc.models import LikelihoodStopSummary


class LikelihoodStopSummaryFilterSet(django_filters.FilterSet):
    """FilterSet for LikelihoodStopSummary materialized view"""

    class Meta:
        model = LikelihoodStopSummary
        exclude = ["id"]

    def __init__(self, *args, **kwargs):
        self.agency_id = kwargs.pop("agency_id")
        super().__init__(*args, **kwargs)

    @property
    def qs(self):
        self.queryset = LikelihoodStopSummary.objects.all()
        qs = super().qs
        if int(self.agency_id) != STATEWIDE:
            qs = qs.filter(agency_id=self.agency_id)
        return qs


def likelihood_stop_query(request, agency_id, debug=False):
    """
    Query LikelihoodStopSummary view for stop likelihood data.

    Related notebooks:
    - https://nccopwatch-share.s3.amazonaws.com/2024-04-likelihood-of-stops/likelihood-of-stops.html
    """  # noqa
    # Build query to filter down queryset
    filter_set = LikelihoodStopSummaryFilterSet(request.GET, agency_id=agency_id)
    qs = filter_set.qs
    df = pd.DataFrame(qs.values())
    df = df.rename(columns={"driver_race_comb": "driver_race"})
    df.fillna(0, inplace=True)

    # Define the desired order, excluding White
    race_order = ["Black", "Hispanic", "Asian", "Native American", "Other"]

    # Remove White drivers from the DataFrame
    df = df[df["driver_race"] != "White"]

    # Ensure driver_race column follows this order
    df["driver_race"] = pd.Categorical(df["driver_race"], categories=race_order, ordered=True)
    df = df.sort_values("driver_race")  # Sort based on defined order

    if debug:
        print(qs.explain(analyze=True, verbose=True))
        print(df)

    return df


class LikelihoodStopView(APIView):
    """Comparison of Population to Traffic Stops"""

    def get(self, request, agency_id):
        # Build chart data
        chart_df = likelihood_stop_query(request=request, agency_id=agency_id)

        # Extract only stop_rate_ratio values as an array
        stop_percentages = chart_df["stop_rate_ratio"].tolist()

        data = {
            "stop_percentages": stop_percentages,
            "table_data": chart_df.to_dict(orient="records"),
        }
        return Response(data=data, status=200)
