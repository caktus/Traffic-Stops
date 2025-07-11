import datetime
import math

from functools import reduce
from operator import concat

import numpy as np
import pandas as pd

from dateutil import relativedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q, Sum
from django.db.models.functions import ExtractYear
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_extensions.key_constructor import bits
from rest_framework_extensions.key_constructor.constructors import DefaultObjectKeyConstructor

from nc import serializers
from nc.constants import (
    CONTRABAND_TYPE_COLS,
    DEFAULT_RENAME_COLUMNS,
    DEMOGRAPHICS_COLORS_BG,
    DEMOGRAPHICS_COLORS_BORDER,
    STOP_PURPOSE_COLORS,
)
from nc.filters import DriverStopsFilter
from nc.models import SEARCH_TYPE_CHOICES as SEARCH_TYPE_CHOICES_TUPLES
from nc.models import (
    Agency,
    ContrabandSummary,
    Person,
    Resource,
    StopPurpose,
    StopPurposeGroup,
    StopSummary,
)
from nc.pagination import NoCountPagination
from nc.serializers import ContactFormSerializer
from tsdata.models import StateFacts
from tsdata.utils import GroupedData

GROUPS = {
    "A": "asian",
    "B": "black",
    "I": "native_american",
    "U": "other",
    "W": "white",
    "H": "hispanic",
}

PURPOSE_CHOICES = {
    1: "Speed Limit Violation",
    2: "Stop Light/Sign Violation",
    3: "Driving While Impaired",
    4: "Safe Movement Violation",
    5: "Vehicle Equipment Violation",
    6: "Vehicle Regulatory Violation",
    7: "Seat Belt Violation",
    8: "Investigation",
    9: "Other Motor Vehicle Violation",
    10: "Checkpoint",
}

CONTRABAND_CHOICES = {
    1: "Drugs",
    2: "Alcohol",
    3: "Money",
    4: "Weapons",
    5: "Other",
}

GROUP_DEFAULTS = {
    "asian": 0,
    "black": 0,
    "native_american": 0,
    "other": 0,
    "white": 0,
    "hispanic": 0,
}

SEARCH_TYPE_CHOICES = dict(SEARCH_TYPE_CHOICES_TUPLES)


class QueryKeyConstructor(DefaultObjectKeyConstructor):
    params_query = bits.QueryParamsKeyBit(["officer", "from", "to"])


query_cache_key_func = QueryKeyConstructor()


def get_date_range(request):
    # Only filter is from and to values are found and are valid
    date_precision = "year"
    date_range = Q()
    _from_date = request.query_params.get("from", None)
    _to_date = request.query_params.get("to", None)
    if _from_date and _to_date:
        from_date = datetime.datetime.strptime(_from_date, "%Y-%m-%d")
        to_date = datetime.datetime.strptime(_to_date, "%Y-%m-%d")
        if from_date and to_date:
            delta = relativedelta.relativedelta(to_date, from_date)
            if delta.years < 3:
                date_precision = "month"
                to_date = (to_date + relativedelta.relativedelta(months=1)) - datetime.timedelta(
                    days=1
                )
            date_range = Q(date__range=(from_date, to_date))
    return date_precision, date_range


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


class AgencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Agency.objects.all()
    serializer_class = serializers.AgencySerializer

    def get_stopsummary_qs(self, agency):
        # filter down stops by agency
        qs = StopSummary.objects.all()
        # id == -1 means it's North Carolina State,
        # which then we don't want to filter by agency to view all statewide data.
        if agency.id != -1:
            qs = qs.filter(agency=agency)
        return qs

    def query(self, results, group_by, filter_=None):
        qs = self.get_stopsummary_qs(agency=self.get_object())
        # filter down by officer if supplied
        officer = self.request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)
        if filter_:
            qs = qs.filter(filter_)

        group_by_tuple = group_by
        date_precision, date_range = get_date_range(self.request)
        qs = qs.filter(date_range)
        if date_precision == "year":
            qs = qs.annotate(year=ExtractYear("date"))
        elif date_precision == "month":
            results_group_by = list(results.group_by)
            results_group_by.remove("year")
            results_group_by.append("date")
            results.group_by = tuple(results_group_by)

            gp_list = list(group_by_tuple)
            gp_list.remove("year")
            gp_list.append("date")
            group_by_tuple = tuple(gp_list)

        qs = qs.values(*group_by_tuple)
        order_by = "date" if date_precision == "month" else "year"
        qs = qs.annotate(count=Sum("count")).order_by(order_by)
        for stop in qs:
            data = {}
            if "year" in group_by_tuple:
                data["year"] = stop["year"]

            if "date" in group_by_tuple and date_precision == "month":
                data["date"] = stop["date"].strftime("%b %Y")

            if "stop_purpose" in group_by_tuple:
                data["purpose"] = PURPOSE_CHOICES.get(stop["stop_purpose"], stop["stop_purpose"])

            if "search_type" in group_by_tuple:
                data["search_type"] = SEARCH_TYPE_CHOICES.get(
                    stop["search_type"],
                    stop["search_type"],
                )

            if "driver_race" in group_by_tuple:
                # The 'Hispanic' ethnicity option is now being aggreggated into its
                # own race category, and its count excluded from the other counts.
                if stop["driver_ethnicity"] == "H":
                    race = GROUPS.get("H", "H")
                else:
                    race = GROUPS.get(stop["driver_race"], stop["driver_race"])

                data.setdefault(race, 0)
                data[race] += stop["count"]

            results.add(**data)

    @action(detail=True, methods=["get"])
    def stops(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"))
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    def stops_by_reason(self, request, pk=None):
        response = {}
        # stops
        results = GroupedData(by=("purpose", "year"), defaults=GROUP_DEFAULTS)
        self.query(results, group_by=("stop_purpose", "year", "driver_race", "driver_ethnicity"))
        response["stops"] = results.flatten()
        # searches
        results = GroupedData(by=("purpose", "year"), defaults=GROUP_DEFAULTS)
        self.query(
            results,
            group_by=("stop_purpose", "year", "driver_race", "driver_ethnicity"),
            filter_=Q(search_type__isnull=False),
        )
        response["searches"] = results.flatten()
        return Response(response)

    @action(detail=True, methods=["get"])
    def use_of_force(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False) & Q(engage_force="t")
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    def searches(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    def searches_by_type(self, request, pk=None):
        results = GroupedData(by=("search_type", "year"), defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False)
        self.query(
            results,
            group_by=(
                "search_type",
                "year",
                "driver_race",
                "driver_ethnicity",
            ),
            filter_=q,
        )
        return Response(results.flatten())


class DriverStopsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Person.objects.filter(type="D")
        .select_related("stop__agency")
        .order_by("-stop__date")
        .only(
            "stop__stop_id",
            "stop__date",
            "stop__agency_id",
            "stop__purpose",
            "stop__action",
            "stop__officer_id",
            "gender",
            "race",
            "ethnicity",
            "age",
        )
    )
    pagination_class = NoCountPagination
    serializer_class = serializers.PersonStopSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = DriverStopsFilter


class StateFactsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StateFacts.objects.all()
    serializer_class = serializers.StateFactsSerializer


class ResourcesViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ResourcesSerializer

    def get_serializer_class(self):
        return serializers.ResourcesSerializer(context={"request": self.request})

    def get_queryset(self):
        return Resource.objects.prefetch_related("resourcefile_set").all()

    @method_decorator(never_cache)
    def list(self, request, *args, **kwargs):
        return Response(
            {
                "results": self.serializer_class(
                    self.get_queryset(),
                    many=True,
                    context={"request": self.request},
                ).data
            }
        )


class ContactView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        if serializer.is_valid():
            contact_name = serializer.data.get("name")
            contact_email = serializer.data.get("email")
            message = serializer.data.get("message")
            send_mail(
                f"{contact_name} ({contact_email}) has submitted a message.",
                message,
                settings.DEFAULT_FROM_EMAIL,
                settings.CONTACT_US_EMAILS,
            )
            return Response(status=204)
        else:
            return Response(data=serializer.errors, status=400)


class AgencyTrafficStopsByPercentageView(APIView):
    def build_response(self, df, x_range):
        def get_values(race):
            if race in df:
                return list(df[race].values)

            return [0] * len(x_range)

        return {
            "labels": x_range,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        stop_qs = StopSummary.objects.all().annotate(year=ExtractYear("date"))

        agency_id = int(agency_id)
        if agency_id != -1:
            stop_qs = stop_qs.filter(agency_id=agency_id)

        officer = request.query_params.get("officer", None)
        if officer:
            stop_qs = stop_qs.filter(officer_id=officer)

        date_precision = "year"
        qs_values = [date_precision, "driver_race_comb"]

        stop_qs = stop_qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)

        if stop_qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        stops_df = pd.DataFrame(stop_qs)

        unique_x_range = stops_df[date_precision].unique()

        stop_pivot_df = stops_df.pivot(
            index=date_precision, columns="driver_race_comb", values="count"
        ).fillna(value=0)
        stops_df = pd.DataFrame(stop_pivot_df)

        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        for year in unique_x_range:
            total_stops_for_year = sum(
                float(stops_df[c][year]) for c in columns if c in stops_df and year in stops_df[c]
            )
            for col in columns:
                if col not in stops_df or year not in stops_df[col]:
                    continue
                try:
                    stops_df[col][year] = float(stops_df[col][year] / total_stops_for_year)
                except ZeroDivisionError:
                    stops_df[col][year] = 0

        data = self.build_response(stops_df, unique_x_range)
        return Response(data=data, status=200)


class AgencyTrafficStopsByCountView(APIView):
    def build_response(self, df, x_range, purpose=None):
        def get_values(race):
            if purpose and purpose in df and race in df[purpose]:
                return list(df[purpose][race].values)
            elif purpose is None and race in df:
                return list(df[race].values)

            return [0] * len(x_range)

        return {
            "labels": x_range,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        date_precision, date_range = get_date_range(request)

        qs = StopSummary.objects.all()
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        qs = qs.filter(date_range)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        if date_precision == "year":
            qs = qs.annotate(year=ExtractYear("date"))
        else:
            date_precision = "date"

        qs_df_cols = ["driver_race_comb"]
        stop_purpose = int(request.query_params.get("purpose", 0))
        if stop_purpose != 0:
            qs_df_cols.insert(0, "stop_purpose")
        qs_values = [date_precision] + qs_df_cols

        qs = qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)
        df = pd.DataFrame(qs)
        unique_x_range = df[date_precision].unique()
        pivot_df = df.pivot(index=date_precision, columns=qs_df_cols, values="count").fillna(
            value=0
        )
        df = pd.DataFrame(pivot_df)
        data = self.build_response(df, unique_x_range, stop_purpose if stop_purpose != 0 else None)
        return Response(data=data, status=200)


class AgencyStopPurposeGroupView(APIView):
    def get_values(self, df, stop_purpose, years_len):
        if stop_purpose and stop_purpose in df:
            return list(df[stop_purpose].values)
        else:
            return [0] * years_len

    def get(self, request, agency_id):
        date_precision, date_range = get_date_range(request)
        qs = StopSummary.objects.all()
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)

        qs = qs.filter(date_range)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        if date_precision == "year":
            qs = qs.annotate(year=ExtractYear("date"))
        else:
            date_precision = "date"

        qs = (
            qs.values(date_precision, "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by(date_precision)
        )

        df = pd.DataFrame(qs)
        unique_x_range = df[date_precision].unique()
        pivot_df = df.pivot(
            index=date_precision, columns="stop_purpose_group", values="count"
        ).fillna(value=0)
        df = pd.DataFrame(pivot_df)
        years_len = len(unique_x_range)
        data = {
            "labels": unique_x_range,
            "datasets": [
                {
                    "label": StopPurposeGroup.SAFETY_VIOLATION,
                    "data": self.get_values(df, StopPurposeGroup.SAFETY_VIOLATION, years_len),
                    "borderColor": STOP_PURPOSE_COLORS["saftey_violation"],
                    "backgroundColor": STOP_PURPOSE_COLORS["saftey_violation"],
                },
                {
                    "label": StopPurposeGroup.REGULATORY_EQUIPMENT,
                    "data": self.get_values(df, StopPurposeGroup.REGULATORY_EQUIPMENT, years_len),
                    "borderColor": STOP_PURPOSE_COLORS["regulatory_equipment"],
                    "backgroundColor": STOP_PURPOSE_COLORS["regulatory_equipment"],
                },
                {
                    "label": StopPurposeGroup.OTHER,
                    "data": self.get_values(df, StopPurposeGroup.OTHER, years_len),
                    "borderColor": STOP_PURPOSE_COLORS["other"],
                    "backgroundColor": STOP_PURPOSE_COLORS["other"],
                },
            ],
        }
        return Response(data=data, status=200)


class AgencyStopGroupByPurposeView(APIView):
    def group_by_purpose(self, df, purpose, years):
        def get_values(col):
            if purpose in df and col in df[purpose]:
                return list(df[purpose][col].values)
            return [0] * len(years)

        return {
            "labels": years,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        date_precision, date_range = get_date_range(request)
        qs = StopSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)

        qs = qs.filter(date_range)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        if qs.count() == 0:
            return Response(
                data={
                    "labels": [],
                    "safety": {"labels": [], "datasets": []},
                    "regulatory": {"labels": [], "datasets": []},
                    "other": {"labels": [], "datasets": []},
                    "max_step_size": 0,
                },
                status=200,
            )

        if date_precision == "year":
            qs = qs.annotate(year=ExtractYear("date"))
        else:
            date_precision = "date"

        qs = (
            qs.values(date_precision, "driver_race_comb", "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by(date_precision)
        )
        df = pd.DataFrame(qs)
        unique_x_range = df[date_precision].unique()
        pivot_table = pd.pivot_table(
            df,
            index=date_precision,
            columns=["stop_purpose_group", "driver_race_comb"],
            values="count",
        ).fillna(value=0)

        pivot_df = pd.DataFrame(pivot_table)
        safety_data = self.group_by_purpose(
            pivot_df, StopPurposeGroup.SAFETY_VIOLATION, unique_x_range
        )
        regulatory_data = self.group_by_purpose(
            pivot_df, StopPurposeGroup.REGULATORY_EQUIPMENT, unique_x_range
        )
        other_data = self.group_by_purpose(pivot_df, StopPurposeGroup.OTHER, unique_x_range)

        # Get the max value to keep the graphs consistent when
        # next to each other by setting the max y value
        max_step_size = max(
            reduce(
                concat,
                [d["data"] for d in safety_data["datasets"]]
                + [d["data"] for d in regulatory_data["datasets"]]
                + [d["data"] for d in other_data["datasets"]],
            )
        )

        data = {
            "labels": unique_x_range,
            "safety": safety_data,
            "regulatory": regulatory_data,
            "other": other_data,
            "max_step_size": round(max_step_size, -3) + 1000,  # Round to nearest 100
        }

        return Response(data=data, status=200)


class AgencyContrabandView(APIView):
    def get(self, request, agency_id):
        year = request.GET.get("year", None)

        qs = ContrabandSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        contraband_qs = qs
        if year:
            contraband_qs = contraband_qs.annotate(year=ExtractYear("date")).filter(year=year)

        contraband_qs = contraband_qs.values("driver_race_comb").annotate(
            search_count=Count("search_id", distinct=True),
            contraband_found_count=Count("contraband_id", distinct=True),
        )

        # Build charts data
        contraband_percentages_df = pd.DataFrame(contraband_qs)
        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        contraband_percentages = [0] * len(columns)

        if contraband_qs.count() > 0:
            for i, c in enumerate(columns):
                filtered_df = contraband_percentages_df[
                    contraband_percentages_df["driver_race_comb"] == c
                ]
                search_count = filtered_df["search_count"].values[0] if not filtered_df.empty else 0
                contraband_found_count = (
                    filtered_df["contraband_found_count"].values[0] if not filtered_df.empty else 0
                )
                try:
                    hit_rate = contraband_found_count / search_count
                except ZeroDivisionError:
                    hit_rate = 0

                if math.isnan(hit_rate):
                    hit_rate = 0
                contraband_percentages[i] = hit_rate

        # Build modal table data
        table_data_qs = (
            qs.values("driver_race_comb")
            .annotate(
                search_count=Count("search_id", distinct=True),
                contraband_found_count=Count("contraband_id", distinct=True),
            )
            .annotate(year=ExtractYear("date"))
        )
        table_data = create_table_data_response(table_data_qs, value_key="contraband_found_count")
        data = {
            "contraband_percentages": contraband_percentages,
            "table_data": table_data,
        }
        return Response(data=data, status=200)


class AgencyContrabandTypesView(APIView):
    def get(self, request, agency_id):
        year = request.GET.get("year", None)

        qs = ContrabandSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        contraband_qs = qs
        if year:
            contraband_qs = contraband_qs.annotate(year=ExtractYear("date")).filter(year=year)

        contraband_qs = contraband_qs.values("contraband_type").annotate(
            search_count=Count("search_id", distinct=False),
            contraband_found_count=Count(
                "contraband_id", distinct=True, filter=Q(contraband_found=True)
            ),
        )

        # Build charts data
        contraband_percentages_df = pd.DataFrame(contraband_qs)
        columns = ["Alcohol", "Drugs", "Money", "Other", "Weapons"]
        contraband_percentages = [0] * len(columns)

        if contraband_qs.count() > 0:
            for i, c in enumerate(columns):
                filtered_df = contraband_percentages_df[
                    contraband_percentages_df["contraband_type"] == c
                ]
                search_count = filtered_df["search_count"].values[0] if not filtered_df.empty else 0
                contraband_found_count = (
                    filtered_df["contraband_found_count"].values[0] if not filtered_df.empty else 0
                )
                try:
                    hit_rate = contraband_found_count / search_count
                except ZeroDivisionError:
                    hit_rate = 0

                if math.isnan(hit_rate):
                    hit_rate = 0
                contraband_percentages[i] = hit_rate

        # Build modal table data
        table_data_qs = (
            qs.values("contraband_type")
            .annotate(
                search_count=Count("search_id", distinct=True),
                contraband_found_count=Count(
                    "contraband_id", distinct=True, filter=Q(contraband_found=True)
                ),
            )
            .annotate(year=ExtractYear("date"))
        )
        table_data = create_table_data_response(
            table_data_qs,
            pivot_columns=["contraband_type"],
            value_key="contraband_found_count",
            rename_columns=CONTRABAND_TYPE_COLS,
        )

        data = {
            "contraband_percentages": contraband_percentages,
            "table_data": table_data,
        }

        return Response(data=data, status=200)


class AgencyContrabandStopPurposeView(APIView):
    def group_by_purpose(self, df, purpose, years):
        def get_values(col):
            if purpose in df and col in df[purpose]:
                return list(df[purpose][col].values)
            return [0] * len(years)

        return {
            "labels": years,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                },
            ],
        }

    def get(self, request, agency_id):
        year = request.GET.get("year", None)

        qs = ContrabandSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        contraband_qs = qs
        if year:
            contraband_qs = contraband_qs.annotate(year=ExtractYear("date")).filter(year=year)

        contraband_qs = contraband_qs.values("driver_race_comb", "stop_purpose_group").annotate(
            search_count=Count("search_id", distinct=True),
            contraband_found_count=Count("contraband_id", distinct=True),
        )

        # Build charts data
        contraband_percentages_df = pd.DataFrame(contraband_qs).fillna(value=0)
        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        contraband_percentages = []
        stop_purpose_types = [
            StopPurposeGroup.SAFETY_VIOLATION,
            StopPurposeGroup.REGULATORY_EQUIPMENT,
            StopPurposeGroup.OTHER,
        ]

        if contraband_qs.count() > 0:
            for stop_purpose in stop_purpose_types:
                group = {
                    "stop_purpose": " ".join(
                        [name.title() for name in stop_purpose.name.split("_")]
                    ),
                    "data": [0] * len(columns),
                }

                for i, c in enumerate(columns):
                    filtered_df = contraband_percentages_df[
                        contraband_percentages_df["driver_race_comb"] == c
                    ]
                    filtered_df = filtered_df[
                        filtered_df["stop_purpose_group"] == stop_purpose.value
                    ]
                    search_count = (
                        filtered_df["search_count"].values[0] if not filtered_df.empty else 0
                    )
                    contraband_found_count = (
                        filtered_df["contraband_found_count"].values[0]
                        if not filtered_df.empty
                        else 0
                    )
                    try:
                        hit_rate = contraband_found_count / search_count
                    except ZeroDivisionError:
                        hit_rate = 0

                    if math.isnan(hit_rate):
                        hit_rate = 0
                    group["data"][i] = hit_rate

                contraband_percentages.append(group)

        # Build modal data
        table_data_qs = (
            qs.values("driver_race_comb", "stop_purpose_group")
            .annotate(
                search_count=Count("search_id", distinct=True),
                contraband_found_count=Count("contraband_id", distinct=True),
            )
            .annotate(year=ExtractYear("date"))
            .order_by("year")
        )
        table_data = {"labels": [], "safety": [], "regulatory": [], "other": []}
        if table_data_qs.count() > 0:
            table_df = pd.DataFrame(table_data_qs)
            pivot_df = table_df.pivot(
                index="year",
                columns=["stop_purpose_group", "driver_race_comb"],
                values="contraband_found_count",
            ).fillna(value=0)

            unique_years = table_df.year.unique()
            safety_data = self.group_by_purpose(
                pivot_df, StopPurposeGroup.SAFETY_VIOLATION, unique_years
            )
            regulatory_data = self.group_by_purpose(
                pivot_df, StopPurposeGroup.REGULATORY_EQUIPMENT, unique_years
            )
            other_data = self.group_by_purpose(pivot_df, StopPurposeGroup.OTHER, unique_years)
            table_data.update(
                {
                    "labels": unique_years,
                    "safety": safety_data,
                    "regulatory": regulatory_data,
                    "other": other_data,
                }
            )

        data = {
            "contraband_percentages": contraband_percentages,
            "table_data": table_data,
        }
        return Response(data=data, status=200)


class AgencyContrabandGroupedStopPurposeView(APIView):
    contraband_types = [
        "Drugs",
        "Alcohol",
        "Money",
        "Weapons",
        "Other",
    ]

    columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]

    def create_dataset(self, contraband_df, searches_df, stop_purpose):
        data = []

        searches_df = searches_df[searches_df["stop_purpose_group"] == stop_purpose]
        contraband_df = contraband_df[contraband_df["stop_purpose_group"] == stop_purpose]

        for contraband in self.contraband_types:
            group = {
                "contraband": contraband,
                "data": [],
            }
            for c in self.columns:
                s_df = searches_df[searches_df["driver_race_comb"] == c]
                searches_count = s_df["search_count"].values[0] if not s_df.empty else 0

                c_df = contraband_df[contraband_df["driver_race_comb"] == c]
                c_df = c_df[c_df["contraband_type"] == contraband]
                contraband_count = c_df["contraband_found_count"].values[0] if not c_df.empty else 0

                try:
                    hit_rate = contraband_count / searches_count
                except ZeroDivisionError:
                    hit_rate = 0

                if math.isnan(hit_rate):
                    hit_rate = 0

                group["data"].append(hit_rate)
            data.append(group)
        return data

    def get(self, request, agency_id):
        year = request.GET.get("year", None)

        qs = ContrabandSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        if year:
            qs = qs.annotate(year=ExtractYear("date")).filter(year=year)

        data = [
            {
                "stop_purpose": "Safety Violation",
                "data": [],
            },
            {
                "stop_purpose": "Regulatory and Equipment",
                "data": [],
            },
            {
                "stop_purpose": "Other",
                "data": [],
            },
        ]
        if qs.count() > 0:
            searches_df = pd.DataFrame(
                qs.values("driver_race_comb", "stop_purpose_group").annotate(
                    search_count=Count("search_id", distinct=True)
                )
            )

            contraband_df = pd.DataFrame(
                qs.values("driver_race_comb", "stop_purpose_group", "contraband_type").annotate(
                    contraband_found_count=Count(
                        "contraband_id", distinct=True, filter=Q(contraband_found=True)
                    )
                )
            )

            data = [
                {
                    "stop_purpose": "Safety Violation",
                    "data": self.create_dataset(
                        contraband_df, searches_df, StopPurposeGroup.SAFETY_VIOLATION.value
                    ),
                },
                {
                    "stop_purpose": "Regulatory and Equipment",
                    "data": self.create_dataset(
                        contraband_df, searches_df, StopPurposeGroup.REGULATORY_EQUIPMENT.value
                    ),
                },
                {
                    "stop_purpose": "Other",
                    "data": self.create_dataset(
                        contraband_df, searches_df, StopPurposeGroup.OTHER.value
                    ),
                },
            ]
        return Response(data=data, status=200)


class AgencyContrabandStopGroupByPurposeModalView(APIView):
    def get(self, request, agency_id):
        grouped_stop_purpose = request.GET.get("grouped_stop_purpose")
        contraband_type = request.GET.get("contraband_type")

        qs = ContrabandSummary.objects.all()

        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        qs = (
            qs.filter(
                contraband_found=True,
                contraband_type=contraband_type,
                stop_purpose_group=grouped_stop_purpose,
            )
            .values("driver_race_comb")
            .annotate(
                year=ExtractYear("date"), contraband_count=Count("contraband_id", distinct=True)
            )
            .order_by("year")
        )

        table_data = create_table_data_response(qs, value_key="contraband_count")
        data = {"table_data": table_data}
        return Response(data, status=200)


class AgencySearchesByPercentageView(APIView):
    def build_response(self, df, x_range):
        def get_values(race):
            if race in df:
                return list(df[race].values)

            return [0] * len(x_range)

        return {
            "labels": x_range,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        stop_qs = StopSummary.objects.all().annotate(year=ExtractYear("date"))

        search_qs = StopSummary.objects.filter(search_type__isnull=False).annotate(
            year=ExtractYear("date")
        )
        agency_id = int(agency_id)
        if agency_id != -1:
            search_qs = search_qs.filter(agency_id=agency_id)
            stop_qs = stop_qs.filter(agency_id=agency_id)

        officer = request.query_params.get("officer", None)
        if officer:
            search_qs = search_qs.filter(officer_id=officer)
            stop_qs = stop_qs.filter(officer_id=officer)

        date_precision = "year"
        qs_values = [date_precision, "driver_race_comb"]

        search_qs = (
            search_qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)
        )
        stop_qs = stop_qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)

        if search_qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        search_df = pd.DataFrame(search_qs)
        stops_df = pd.DataFrame(stop_qs)

        unique_x_range = search_df[date_precision].unique()
        search_pivot_df = search_df.pivot(
            index=date_precision, columns="driver_race_comb", values="count"
        ).fillna(value=0)
        search_df = pd.DataFrame(search_pivot_df)
        search_df["Average"] = pd.Series([0] * len(unique_x_range))

        stop_pivot_df = stops_df.pivot(
            index=date_precision, columns="driver_race_comb", values="count"
        ).fillna(value=0)
        stops_df = pd.DataFrame(stop_pivot_df)

        columns = ["White", "Black", "Hispanic", "Asian", "Native American", "Other"]
        for year in unique_x_range:
            total_search = 0
            total_stop = 0
            for c in columns:
                if c in search_df and c in stops_df:
                    total_search += search_df[c][year] or 0
                    total_stop += stops_df[c][year] or 0
                    try:
                        search_df[c][year] = float(search_df[c][year]) / float(stops_df[c][year])
                    except (ValueError, ZeroDivisionError):
                        search_df[c][year] = 0
            search_df["Average"][year] = total_search / total_stop

        data = self.build_response(search_df, unique_x_range)
        return Response(data=data, status=200)


class AgencySearchesByCountView(APIView):
    def build_response(self, df, x_range, purpose=None):
        def get_values(race):
            if purpose and purpose in df and race in df[purpose]:
                return list(df[purpose][race].values)
            elif purpose is None and race in df:
                return list(df[race].values)

            return [0] * len(x_range)

        return {
            "labels": x_range,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BG["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        date_precision, date_range = get_date_range(request)

        qs = StopSummary.objects.filter(search_type__isnull=False)
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        qs = qs.filter(date_range)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        if date_precision == "year":
            qs = qs.annotate(year=ExtractYear("date"))
        else:
            date_precision = "date"

        qs_df_cols = ["driver_race_comb"]
        stop_purpose = int(request.query_params.get("search_type", 0))
        if stop_purpose != 0:
            qs_df_cols.insert(0, "search_type")
        qs_values = [date_precision] + qs_df_cols

        qs = qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)
        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)
        df = pd.DataFrame(qs)
        unique_x_range = df[date_precision].unique()
        pivot_df = df.pivot(index=date_precision, columns=qs_df_cols, values="count").fillna(
            value=0
        )
        df = pd.DataFrame(pivot_df)
        data = self.build_response(df, unique_x_range, stop_purpose if stop_purpose != 0 else None)
        return Response(data=data, status=200)


class AgencySearchRateView(APIView):
    def build_response(self, df, labels):
        def get_values(race):
            if race in df:
                values = [float(df[race][label]) if label in df[race] else 0 for label in labels]
                try:
                    average = sum(values) / len(values)
                except ZeroDivisionError:
                    average = 0
                values.insert(0, average)
                return values
            return [0] * (len(labels) + 1)

        # Only return non-white races in response
        included_races = [
            "Black",
            "Hispanic",
            "Asian",
            "Native American",
            "Other",
        ]

        return {
            "labels": ["Average"] + list(labels.values()),
            "datasets": [
                {
                    "label": race,
                    "data": get_values(race),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER[race.lower().replace(" ", "_")],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER[race.lower().replace(" ", "_")],
                }
                for race in included_races
            ],
        }


    def get(self, request, agency_id):
        stop_qs = StopSummary.objects.all().annotate(year=ExtractYear("date"))
        search_qs = StopSummary.objects.filter(search_type__isnull=False).annotate(
            year=ExtractYear("date")
        )

        agency_id = int(agency_id)
        if agency_id != -1:
            search_qs = search_qs.filter(agency_id=agency_id)
            stop_qs = stop_qs.filter(agency_id=agency_id)

        officer = request.query_params.get("officer", None)
        if officer:
            search_qs = search_qs.filter(officer_id=officer)
            stop_qs = stop_qs.filter(officer_id=officer)

        year = request.query_params.get("year", None)
        if year:
            search_qs = search_qs.filter(year=year)
            stop_qs = stop_qs.filter(year=year)

        if search_qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        search_qs = search_qs.values("stop_purpose", "driver_race_comb").annotate(
            count=Sum("count")
        )
        stop_qs = stop_qs.values("stop_purpose", "driver_race_comb").annotate(count=Sum("count"))

        search_df = pd.DataFrame(search_qs)
        stops_df = pd.DataFrame(stop_qs)

        search_pivot_df = search_df.pivot(
            index="stop_purpose", columns="driver_race_comb", values="count"
        ).fillna(value=0)
        search_df = pd.DataFrame(search_pivot_df)

        stop_pivot_df = stops_df.pivot(
            index="stop_purpose", columns="driver_race_comb", values="count"
        ).fillna(value=0)
        stops_df = pd.DataFrame(stop_pivot_df)

        columns = ["Black", "Hispanic", "Asian", "Native American", "Other"]
        purpose_choices = {e.value: e.label for e in StopPurpose}
        purpose_choices = dict(reversed(purpose_choices.items()))

        def get_val(df, column, purpose):
            if column in df and purpose in df[column]:
                val = df[column][purpose]
                return float(0) if np.isnan(val) else float(val)
            return float(0)

        for col in columns:
            for k, v in purpose_choices.items():
                base_searches, base_stops = get_val(search_df, "White", k), get_val(
                    stops_df, "White", k
                )
                purpose_searches, purpose_stops = get_val(search_df, col, k), get_val(
                    stops_df, col, k
                )
                try:
                    base_rate = base_searches / base_stops
                except ZeroDivisionError:
                    base_rate = 0
                try:
                    purpose_rate = float(purpose_searches) / float(purpose_stops)
                except ZeroDivisionError:
                    purpose_rate = 0
                if col in search_df and k in search_df[col]:
                    search_df[col][k] = (
                        (purpose_rate - base_rate) / base_rate if base_rate != 0 else 0
                    )

        data = self.build_response(search_df, purpose_choices)
        return Response(data=data, status=200)


class AgencyUseOfForceView(APIView):
    def build_response(self, df, x_range):
        def get_values(race):
            if race in df:
                return list(df[race].values)

            return [0] * len(x_range)

        return {
            "labels": x_range,
            "datasets": [
                {
                    "label": "White",
                    "data": get_values("White"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["white"],
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["black"],
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["hispanic"],
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["asian"],
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["native_american"],
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                    "backgroundColor": DEMOGRAPHICS_COLORS_BORDER["other"],
                },
            ],
        }

    def get(self, request, agency_id):
        qs = StopSummary.objects.filter(search_type__isnull=False, engage_force="t").annotate(
            year=ExtractYear("date")
        )
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        date_precision = "year"
        qs_values = [date_precision, "driver_race_comb"]

        qs = qs.values(*qs_values).annotate(count=Sum("count")).order_by(date_precision)
        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)
        df = pd.DataFrame(qs)
        unique_x_range = df[date_precision].unique()
        pivot_df = df.pivot(
            index=date_precision, columns="driver_race_comb", values="count"
        ).fillna(value=0)
        df = pd.DataFrame(pivot_df)
        data = self.build_response(df, unique_x_range)
        return Response(data=data, status=200)
