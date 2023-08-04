import datetime

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
from nc.models import Agency, Contraband, Person, Resource, StopPurposeGroup, StopSummary
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

    def get_date_range(self):
        # Only filter is from and to values are found and are valid
        date_precision = "year"
        date_range = Q()
        _from_date = self.request.query_params.get("from", None)
        _to_date = self.request.query_params.get("to", None)
        if _from_date and _to_date:
            from_date = datetime.datetime.strptime(_from_date, "%Y-%m-%d")
            to_date = datetime.datetime.strptime(_to_date, "%Y-%m-%d")
            if from_date and to_date:
                delta = relativedelta.relativedelta(to_date, from_date)
                if delta.years < 3:
                    date_precision = "month"
                    to_date = (
                        to_date + relativedelta.relativedelta(months=1)
                    ) - datetime.timedelta(days=1)
                date_range = Q(date__range=(from_date, to_date))
        return date_precision, date_range

    def query(self, results, group_by, filter_=None):
        qs = self.get_stopsummary_qs(agency=self.get_object())
        # filter down by officer if supplied
        officer = self.request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)
        if filter_:
            qs = qs.filter(filter_)

        group_by_tuple = group_by
        date_precision, date_range = self.get_date_range()
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


class AgencyStopPurposeGroupView(APIView):
    def get(self, request, agency_id):
        qs = (
            StopSummary.objects.filter(agency_id=agency_id)
            .annotate(year=ExtractYear("date"))
            .values("year", "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by("year")
        )
        df = pd.DataFrame(qs)
        unique_years = df.year.unique()
        pivot_df = df.pivot(index="year", columns="stop_purpose_group", values="count").fillna(
            value=0
        )
        df = pd.DataFrame(pivot_df)
        data = {
            "labels": unique_years,
            "datasets": [
                {
                    "label": StopPurposeGroup.SAFETY_VIOLATION,
                    "data": list(df[StopPurposeGroup.SAFETY_VIOLATION].values),
                    "borderColor": "#7F428A",
                    "backgroundColor": "#CFA9D6",
                },
                {
                    "label": StopPurposeGroup.REGULATORY_EQUIPMENT,
                    "data": list(df[StopPurposeGroup.REGULATORY_EQUIPMENT].values),
                    "borderColor": "#b36800",
                    "backgroundColor": "#ffa500",
                },
                {
                    "label": StopPurposeGroup.OTHER,
                    "data": list(df[StopPurposeGroup.OTHER].values),
                    "borderColor": "#1B4D3E",
                    "backgroundColor": "#ACE1AF",
                },
            ],
        }
        return Response(data=data, status=200)


class AgencyStopGroupByPurposeView(APIView):
    def group_by_purpose(self, df, purpose, years):
        def get_values(col):
            if col in df[purpose]:
                return list(df[purpose][col].values)
            else:
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
        qs = (
            StopSummary.objects.filter(agency_id=agency_id)
            .annotate(year=ExtractYear("date"))
            .values("year", "driver_race_comb", "stop_purpose_group")
            .annotate(count=Sum("count"))
            .order_by("year")
        )
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
