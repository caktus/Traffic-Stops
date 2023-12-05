import datetime
import math

from functools import reduce
from operator import concat

import pandas as pd

from dateutil import relativedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Case, Count, F, Q, Sum, Value, When
from django.db.models.functions import ExtractYear
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_extensions.cache.decorators import cache_response
from rest_framework_extensions.key_constructor import bits
from rest_framework_extensions.key_constructor.constructors import DefaultObjectKeyConstructor

from nc import serializers
from nc.filters import DriverStopsFilter
from nc.models import SEARCH_TYPE_CHOICES as SEARCH_TYPE_CHOICES_TUPLES
from nc.models import (
    Agency,
    Contraband,
    ContrabandSummary,
    Person,
    Resource,
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
    @cache_response(key_func=query_cache_key_func)
    def stops(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"))
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    @cache_response(key_func=query_cache_key_func)
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
    @cache_response(key_func=query_cache_key_func)
    def use_of_force(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False) & Q(engage_force="t")
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    @cache_response(key_func=query_cache_key_func)
    def searches(self, request, pk=None):
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        return Response(results.flatten())

    @action(detail=True, methods=["get"])
    @cache_response(key_func=query_cache_key_func)
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

    @action(detail=True, methods=["get"])
    @cache_response(key_func=query_cache_key_func)
    def contraband_hit_rate(self, request, pk=None):
        response = {}
        # searches
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(search_type__isnull=False)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        response["searches"] = results.flatten()

        # contraband
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(contraband_found=True)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        response["contraband"] = results.flatten()

        # # contraband types
        qs = Contraband.objects.filter(stop__agency=self.get_object(), person__type="D")
        # # filter down by officer if supplied
        officer = self.request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(stop__officer_id=officer)
        qs = qs.annotate(
            year=ExtractYear("stop__date"),
            driver_race=F("person__race"),
            driver_ethnicity=F("person__ethnicity"),
            drugs_found=Case(
                When(
                    Q(ounces__gt=0)
                    | Q(pounds__gt=0)
                    | Q(dosages__gt=0)
                    | Q(grams__gt=0)
                    | Q(kilos__gt=0),
                    then=Value(True),
                ),
                default=Value(False),
            ),
            alcohol_found=Case(
                When(Q(pints__gt=0) | Q(gallons__gt=0), then=Value(True)), default=Value(False)
            ),
            money_found=Case(When(Q(money__gt=0), then=Value(True)), default=Value(False)),
            weapons_found=Case(When(Q(weapons__gt=0), then=Value(True)), default=Value(False)),
            other_found=Case(When(Q(dollar_amount__gt=0), then=Value(True)), default=Value(False)),
        )

        results = GroupedData(by=("contraband_type", "year"), defaults=GROUP_DEFAULTS)
        # group by specified fields and order by year
        group_by = ("year", "driver_ethnicity", "driver_race")
        for contraband_type in CONTRABAND_CHOICES.values():
            field_name = f"{contraband_type.lower()}_found"
            type_qs = (
                qs.filter(**{field_name: True})
                .values(*group_by)
                .order_by("year")
                .annotate(contraband_type_count=Count(field_name))
            )
            for contraband in type_qs:
                data = {
                    "year": contraband["year"],
                    "contraband_type": contraband_type,
                }
                if "driver_race" in group_by:
                    # The 'Hispanic' ethnicity option is now being aggregated into its
                    # own race category, and its count excluded from the other counts.
                    if contraband["driver_ethnicity"] == "H":
                        race = GROUPS.get("H", "H")
                    else:
                        race = GROUPS.get(contraband["driver_race"], contraband["driver_race"])
                    data.setdefault(race, 0)
                    data[race] += contraband["contraband_type_count"]
                results.add(**data)
        response["contraband_types"] = results.flatten()
        return Response(response)


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
                    "borderColor": "#02bcbb",
                    "backgroundColor": "#80d9d8",
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": "#8879fc",
                    "backgroundColor": "#beb4fa",
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": "#9c0f2e",
                    "backgroundColor": "#ca8794",
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": "#ffe066",
                    "backgroundColor": "#ffeeb2",
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": "#0c3a66",
                    "backgroundColor": "#8598ac",
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": "#9e7b9b",
                    "backgroundColor": "#cab6c7",
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


class AgencyStopPurposeGroupView(APIView):
    def get_values(self, df, stop_purpose, years_len):
        if stop_purpose and stop_purpose in df:
            return list(df[stop_purpose].values)
        else:
            return [0] * years_len

    def get(self, request, agency_id):
        qs = StopSummary.objects.all()
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)

        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)

        qs = (
            qs.annotate(year=ExtractYear("date"))
            .values("year", "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by("year")
        )
        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)

        df = pd.DataFrame(qs)
        unique_years = df.year.unique()
        pivot_df = df.pivot(index="year", columns="stop_purpose_group", values="count").fillna(
            value=0
        )
        df = pd.DataFrame(pivot_df)
        years_len = len(unique_years)
        data = {
            "labels": unique_years,
            "datasets": [
                {
                    "label": StopPurposeGroup.SAFETY_VIOLATION,
                    "data": self.get_values(df, StopPurposeGroup.SAFETY_VIOLATION, years_len),
                    "borderColor": "#7F428A",
                    "backgroundColor": "#CFA9D6",
                },
                {
                    "label": StopPurposeGroup.REGULATORY_EQUIPMENT,
                    "data": self.get_values(df, StopPurposeGroup.REGULATORY_EQUIPMENT, years_len),
                    "borderColor": "#b36800",
                    "backgroundColor": "#ffa500",
                },
                {
                    "label": StopPurposeGroup.OTHER,
                    "data": self.get_values(df, StopPurposeGroup.OTHER, years_len),
                    "borderColor": "#1B4D3E",
                    "backgroundColor": "#ACE1AF",
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
                    "borderColor": "#02bcbb",
                    "backgroundColor": "#80d9d8",
                },
                {
                    "label": "Black",
                    "data": get_values("Black"),
                    "borderColor": "#8879fc",
                    "backgroundColor": "#beb4fa",
                },
                {
                    "label": "Hispanic",
                    "data": get_values("Hispanic"),
                    "borderColor": "#9c0f2e",
                    "backgroundColor": "#ca8794",
                },
                {
                    "label": "Asian",
                    "data": get_values("Asian"),
                    "borderColor": "#ffe066",
                    "backgroundColor": "#ffeeb2",
                },
                {
                    "label": "Native American",
                    "data": get_values("Native American"),
                    "borderColor": "#0c3a66",
                    "backgroundColor": "#8598ac",
                },
                {
                    "label": "Other",
                    "data": get_values("Other"),
                    "borderColor": "#9e7b9b",
                    "backgroundColor": "#cab6c7",
                },
            ],
        }

    def get(self, request, agency_id):
        qs = StopSummary.objects.all()
        agency_id = int(agency_id)
        if agency_id != -1:
            qs = qs.filter(agency_id=agency_id)
        officer = request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)
        qs = (
            qs.annotate(year=ExtractYear("date"))
            .values("year", "driver_race_comb", "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by("year")
        )
        if qs.count() == 0:
            return Response(data={"labels": [], "datasets": []}, status=200)
        df = pd.DataFrame(qs)
        unique_years = df.year.unique()
        pivot_table = pd.pivot_table(
            df, index="year", columns=["stop_purpose_group", "driver_race_comb"], values="count"
        ).fillna(value=0)
        pivot_df = pd.DataFrame(pivot_table)

        safety_data = self.group_by_purpose(
            pivot_df, StopPurposeGroup.SAFETY_VIOLATION, unique_years
        )
        regulatory_data = self.group_by_purpose(
            pivot_df, StopPurposeGroup.REGULATORY_EQUIPMENT, unique_years
        )
        other_data = self.group_by_purpose(pivot_df, StopPurposeGroup.OTHER, unique_years)

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
            "labels": unique_years,
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
        table_data = []
        if table_data_qs.count() > 0:
            pivot_df = (
                pd.DataFrame(table_data_qs)
                .pivot(index="year", columns=["driver_race_comb"], values="contraband_found_count")
                .fillna(value=0)
            )

            pivot_df = pd.DataFrame(pivot_df).rename(
                columns={
                    "White": "white",
                    "Black": "black",
                    "Hispanic": "hispanic",
                    "Asian": "asian",
                    "Native American": "native_american",
                    "Other": "other",
                }
            )
            table_data = pivot_df.to_json(orient="table")

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
        table_data = []
        if table_data_qs.count() > 0:
            pivot_df = (
                pd.DataFrame(table_data_qs)
                .pivot(index="year", columns=["contraband_type"], values="contraband_found_count")
                .fillna(value=0)
            )

            pivot_df = pd.DataFrame(pivot_df).rename(
                columns={
                    "Alcohol": "alcohol",
                    "Drugs": "drugs",
                    "Money": "money",
                    "Other": "other",
                    "Weapons": "weapons",
                }
            )
            table_data = pivot_df.to_json(orient="table")

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

        table_data = []
        if qs.count() > 0:
            table_df = (
                pd.DataFrame(qs)
                .pivot(
                    index="year",
                    columns=["driver_race_comb"],
                    values="contraband_count",
                )
                .fillna(value=0)
                .rename(
                    columns={
                        "White": "white",
                        "Black": "black",
                        "Hispanic": "hispanic",
                        "Asian": "asian",
                        "Native American": "native_american",
                        "Other": "other",
                    }
                )
            )
            table_data = table_df.to_json(orient="table")

        data = {"table_data": table_data}
        return Response(data, status=200)
