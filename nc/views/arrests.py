import django_filters
import pandas as pd

from django.db.models import Count, Q, Sum
from django.db.models.functions import ExtractYear
from rest_framework.response import Response
from rest_framework.views import APIView

from nc.constants import CONTRABAND_TYPE_COLS, DEFAULT_RENAME_COLUMNS, STATEWIDE
from nc.models import ContrabandSummary, StopPurpose, StopPurposeGroup, StopSummary


def create_table_data_response(qs, pivot_columns=None, value_key=None, rename_columns=None):
    rename_cols = rename_columns if rename_columns else DEFAULT_RENAME_COLUMNS
    pivot_cols = pivot_columns if pivot_columns else ["driver_race_comb"]
    table_data = []

    if qs.exists():
        pivot_df = (
            pd.DataFrame(qs)
            .pivot(index="year", columns=pivot_cols, values=value_key)
            .fillna(value=0)
        )

        pivot_df = pd.DataFrame(pivot_df).rename(columns=rename_cols)
        table_data = pivot_df.to_json(orient="table")
    return table_data


def arrest_table(df, pivot_columns=None, value_key=None, rename_columns=None):
    rename_cols = rename_columns if rename_columns else DEFAULT_RENAME_COLUMNS
    pivot_cols = pivot_columns if pivot_columns else ["driver_race_comb"]
    table_data = []

    pivot_df = df.pivot(index="year", columns=pivot_cols, values=value_key).fillna(value=0)

    pivot_df = pd.DataFrame(pivot_df).rename(columns=rename_cols)
    table_data = pivot_df.to_json(orient="table")

    return table_data


class ArrestSummaryFilterSet(django_filters.FilterSet):
    """FilterSet for StopSummary arrest and stop data"""

    year = django_filters.NumberFilter(field_name="year")
    grouped_stop_purpose = django_filters.ChoiceFilter(
        choices=StopPurposeGroup.choices, field_name="stop_purpose_group"
    )
    stop_purpose_type = django_filters.CharFilter(method="filter_stop_purpose_type")
    officer = django_filters.CharFilter(field_name="officer_id")

    class Meta:
        model = StopSummary
        fields = ("stop_purpose",)

    def __init__(self, *args, **kwargs):
        self.agency_id = kwargs.pop("agency_id")
        super().__init__(*args, **kwargs)

    def filter_stop_purpose_type(self, queryset, name, value):
        """Filter by StopPurpose label"""
        stop_purpose = StopPurpose.get_by_label(value)
        if stop_purpose:
            return queryset.filter(stop_purpose=stop_purpose)
        return queryset

    @property
    def qs(self):
        self.queryset = StopSummary.objects.annotate(year=ExtractYear("date"))
        qs = super().qs
        if int(self.agency_id) != STATEWIDE:
            qs = qs.filter(agency_id=self.agency_id)
        return qs


def arrest_query(request, agency_id, group_by, debug=False):
    """
    Query StopSummary view for arrest-related counts.

    Related notebooks:
    - https://nccopwatch-share.s3.amazonaws.com/2023-10-contraband-type/durham-contraband-hit-rate-type.html
    - https://nccopwatch-share.s3.amazonaws.com/2024-01-arrest-data/arrest-data-preview-v7.html
    """  # noqa
    # Build query to filter down queryest
    filter_set = ArrestSummaryFilterSet(request.GET, agency_id=agency_id)
    # Perform query with SQL aggregations
    qs = filter_set.qs.values(*group_by).annotate(
        stop_count=Sum("count"),
        search_count=Sum("count", filter=Q(driver_searched=True)),
        arrest_count=Sum("count", filter=Q(driver_arrest=True)),
    )
    df = pd.DataFrame(qs)
    if df.empty:
        # Create empty DF with expected column names
        df = pd.DataFrame(
            qs, columns=list(qs.query.values_select) + list(qs.query.annotation_select)
        )
    # Calculate rates
    df["stop_arrest_rate"] = df.arrest_count / df.stop_count
    df["search_arrest_rate"] = df.arrest_count / df.search_count
    df["stop_without_arrest_count"] = df["stop_count"] - df["arrest_count"]
    df.fillna(0, inplace=True)
    if "driver_race_comb" in group_by:
        # Add custom sortable driver race column
        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        df["driver_race_category"] = pd.Categorical(df["driver_race_comb"], columns)
    if debug:
        print(qs.explain(analyze=True, verbose=True))
        print(df)
    return df


class ArrestContrabandSummaryFilterSet(django_filters.FilterSet):
    """FilterSet for StopSummary arrest and stop data"""

    year = django_filters.NumberFilter(field_name="year")
    grouped_stop_purpose = django_filters.ChoiceFilter(
        choices=StopPurposeGroup.choices, field_name="stop_purpose_group"
    )
    officer = django_filters.CharFilter(field_name="officer_id")

    class Meta:
        model = ContrabandSummary
        fields = ("agency",)

    def __init__(self, *args, **kwargs):
        self.agency_id = kwargs.pop("agency_id")
        super().__init__(*args, **kwargs)

    @property
    def qs(self):
        self.queryset = ContrabandSummary.objects.annotate(year=ExtractYear("date"))
        qs = super().qs
        if int(self.agency_id) != STATEWIDE:
            qs = qs.filter(agency_id=self.agency_id)
        return qs


def contraband_query(request, agency_id, group_by, debug=False):
    """Query ContrabandSummary for arrest-related counts."""
    # Build query to filter down queryest
    filter_set = ArrestContrabandSummaryFilterSet(request.GET, agency_id=agency_id)
    # Perform query with SQL aggregations
    qs = (
        filter_set.qs.values(*group_by)
        .annotate(
            contraband_count=Count("stop", filter=Q(contraband_found=True)),
            contraband_and_driver_arrest_count=Count(
                "stop", filter=Q(contraband_found=True, driver_arrest=True)
            ),
        )
        .order_by("contraband_type")
    )
    df = pd.DataFrame(qs)
    if df.empty:
        df = pd.DataFrame(
            qs, columns=list(qs.query.values_select) + list(qs.query.annotation_select)
        )
    # Query stop counts
    stop_df = arrest_query(request, agency_id, group_by=("agency_id",))
    df["stop_count"] = stop_df.iloc[0]["stop_count"] if not stop_df.empty else 0
    # Calculate rates
    df["driver_contraband_arrest_rate"] = (
        df.contraband_and_driver_arrest_count / df.contraband_count
    )
    df["driver_stop_arrest_rate"] = df.contraband_and_driver_arrest_count / df.stop_count
    df.fillna(0, inplace=True)
    if "driver_race_comb" in group_by:
        # Add custom sortable driver race column
        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        df["driver_race_category"] = pd.Categorical(df["driver_race_comb"], columns)
    if debug:
        print(qs.explain(analyze=True, verbose=True))
        print(df)
    return df


def sort_by_stop_purpose(df):
    """Sort DataFrame by stop_purpose column in order of its IntegerChoices"""
    df["stop_purpose_category"] = pd.Categorical(df["stop_purpose"], list(StopPurpose))
    return df.sort_values("stop_purpose_category")


def sort_by_stop_purpose_group(df):
    """Sort DataFrame by stop_purpose_group column in order of its IntegerChoices"""
    df["spg_category"] = pd.Categorical(df["stop_purpose_group"], list(StopPurposeGroup))
    return df.sort_values("spg_category")


class AgencyArrestsPercentageOfStopsView(APIView):
    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Build chart data
        chart_df = arrest_query(request, agency_id, group_by=("driver_race_comb",))
        chart_data = chart_df.sort_values("driver_race_category")["stop_arrest_rate"].to_list()
        # Build table data
        table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
        table_data = arrest_table(table_df, value_key="arrest_count")
        data = {"arrest_percentages": chart_data, "table_data": table_data}
        return Response(data=data, status=200)


class AgencyArrestsPercentageOfSearchesView(APIView):
    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Build chart data
        chart_df = arrest_query(request, agency_id, group_by=("driver_race_comb",))
        chart_data = chart_df.sort_values("driver_race_category")["search_arrest_rate"].to_list()
        # Build table data
        table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
        table_data = arrest_table(table_df, value_key="arrest_count")
        data = {"arrest_percentages": chart_data, "table_data": table_data}
        return Response(data=data, status=200)


class AgencyCountOfStopsAndArrests(APIView):
    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Build chart data
        chart_df = arrest_query(request, agency_id, group_by=("driver_race_comb",)).sort_values(
            "driver_race_category"
        )
        not_arrested_group = {"data": chart_df["stop_without_arrest_count"].to_list()}
        arrested_group = {"data": chart_df["arrest_count"].to_list()}
        chart_data = [arrested_group, not_arrested_group]
        # Build table data
        table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
        table_data = arrest_table(table_df, value_key="arrest_count")
        data = {"arrest_counts": chart_data, "table_data": table_data}
        return Response(data=data, status=200)


class AgencyArrestsPercentageOfStopsByGroupPurposeView(APIView):
    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Conditionally build table data
        if request.query_params.get("modal"):
            table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
            table_data = arrest_table(table_df, value_key="arrest_count")
            return Response(data={"table_data": table_data}, status=200)
        else:
            # Build chart data
            chart_df = arrest_query(request, agency_id, group_by=("stop_purpose_group",))
            chart_df = sort_by_stop_purpose_group(chart_df)
            chart_data = [
                {"stop_purpose": row.stop_purpose_group, "data": row.stop_arrest_rate}
                for row in chart_df.itertuples()
            ]
            return Response(
                data={"arrest_percentages": chart_data},
                status=200,
            )


class AgencyArrestsPercentageOfStopsPerStopPurposeView(APIView):
    """Percentage of Stops Leading to Arrest by Stop Purpose Type"""

    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Conditionally build table data
        if request.query_params.get("modal"):
            table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
            table_data = arrest_table(table_df, value_key="arrest_count")
            return Response(data={"table_data": table_data}, status=200)
        else:
            # Build chart data
            chart_df = arrest_query(request, agency_id, group_by=("stop_purpose",))
            chart_df = sort_by_stop_purpose(chart_df)  # Frontend appears to require specific order?
            chart_data = [
                {"stop_purpose": StopPurpose(row.stop_purpose).label, "data": row.stop_arrest_rate}
                for row in chart_df.itertuples()
            ]
            return Response(
                data={"labels": StopPurpose.labels, "arrest_percentages": chart_data}, status=200
            )


class AgencyArrestsPercentageOfSearchesByGroupPurposeView(APIView):
    """Percentage of Searches Leading to Arrest by Stop Purpose Group"""

    # @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, request, agency_id):
        # Conditionally build table data
        if request.query_params.get("modal"):
            table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
            table_data = arrest_table(table_df, value_key="arrest_count")
            return Response(data={"table_data": table_data}, status=200)
        else:
            # Build chart data
            chart_df = arrest_query(request, agency_id, group_by=("stop_purpose_group",))
            chart_df = sort_by_stop_purpose_group(chart_df)
            chart_data = [
                {"stop_purpose": row.stop_purpose_group, "data": row.search_arrest_rate}
                for row in chart_df.itertuples()
            ]
            return Response(data={"arrest_percentages": chart_data}, status=200)


class AgencyArrestsPercentageOfSearchesPerStopPurposeView(APIView):
    """Percentage of Searches Leading to Arrest by Stop Purpose Type"""

    # @method_decorator(cache_page(settings.CACHE_COUNT_TIMEOUT))
    def get(self, request, agency_id):
        # Conditionally build table data
        if request.query_params.get("modal"):
            table_df = arrest_query(request, agency_id, group_by=("driver_race_comb", "year"))
            table_data = arrest_table(table_df, value_key="arrest_count")
            return Response(data={"table_data": table_data}, status=200)
        else:
            # Build chart data
            chart_df = arrest_query(request, agency_id, group_by=("stop_purpose",))
            chart_df = sort_by_stop_purpose(chart_df)  # Frontend appears to require specific order?
            chart_data = [
                {
                    "stop_purpose": StopPurpose(row.stop_purpose).label,
                    "data": row.search_arrest_rate,
                }
                for row in chart_df.itertuples()
            ]
            return Response(
                data={"labels": StopPurpose.labels, "arrest_percentages": chart_data}, status=200
            )


class AgencyArrestsPercentageOfStopsPerContrabandTypeView(APIView):
    # @method_decorator(cache_page(settings.CACHE_COUNT_TIMEOUT))
    def get(self, request, agency_id):
        chart_df = contraband_query(request, agency_id, group_by=("contraband_type",))
        chart_data = chart_df["driver_contraband_arrest_rate"].to_list()
        # Build table data
        table_df = contraband_query(request, agency_id, group_by=("contraband_type", "year"))
        table_data = arrest_table(
            table_df,
            pivot_columns=["contraband_type"],
            value_key="contraband_and_driver_arrest_count",
            rename_columns=CONTRABAND_TYPE_COLS,
        )
        data = {"arrest_percentages": chart_data, "table_data": table_data}
        return Response(data=data, status=200)


class AgencyStopsYearRange(APIView):
    def get(self, request, agency_id):
        filter_set = ArrestSummaryFilterSet(request.GET, agency_id=agency_id)
        year_range = filter_set.qs.order_by("-year").values_list("year", flat=True).distinct("year")
        data = {"year_range": year_range}
        return Response(data=data, status=200)
