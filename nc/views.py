from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from nc import serializers
from nc.filters import DriverStopsFilter
from nc.models import SEARCH_TYPE_CHOICES as SEARCH_TYPE_CHOICES_TUPLES
from nc.models import Agency, Person, StopSummary
from nc.pagination import NoCountPagination
from nc.serializers import ContactFormSerializer
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_extensions.cache.decorators import cache_response
from rest_framework_extensions.key_constructor import bits
from rest_framework_extensions.key_constructor.constructors import DefaultObjectKeyConstructor
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
    params_query = bits.QueryParamsKeyBit(["officer"])


query_cache_key_func = QueryKeyConstructor()


class AgencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Agency.objects.all()
    serializer_class = serializers.AgencySerializer

    def get_stopsummary_qs(self, agency):
        # filter down stops by agency
        qs = StopSummary.objects.all()
        # id == -1 means it's North Carolina state,
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
        # group by specified fields and order by year
        qs = qs.values(*group_by).order_by("year")
        qs = qs.annotate(count=Sum("count"))
        for stop in qs:
            data = {}
            if "year" in group_by:
                data["year"] = stop["year"]
            if "stop_purpose" in group_by:
                purpose = PURPOSE_CHOICES.get(stop["stop_purpose"], stop["stop_purpose"])
                data["purpose"] = purpose

            if "search_type" in group_by:
                data["search_type"] = SEARCH_TYPE_CHOICES.get(
                    stop["search_type"],
                    stop["search_type"],
                )

            if "driver_race" in group_by:
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
    # @cache_response(key_func=query_cache_key_func)
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
        # searches
        results = GroupedData(by="year", defaults=GROUP_DEFAULTS)
        q = Q(contraband_found=True)
        self.query(results, group_by=("year", "driver_race", "driver_ethnicity"), filter_=q)
        response["contraband"] = results.flatten()
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
