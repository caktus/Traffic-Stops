import datetime

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
from nc.models import Agency, Contraband, Person, Resource, StopSummary
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
    params_query = bits.QueryParamsKeyBit(["officer"])


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

    def query(self, results, group_by, filter_=None):
        qs = self.get_stopsummary_qs(agency=self.get_object())
        # filter down by officer if supplied
        officer = self.request.query_params.get("officer", None)
        if officer:
            qs = qs.filter(officer_id=officer)
        if filter_:
            qs = qs.filter(filter_)

        # Only filter is from and to values are found and are valid
        _from_date = self.request.query_params.get("from", None)
        _to_date = self.request.query_params.get("to", None)
        if _from_date and _to_date:
            from_date = datetime.datetime.strptime(_from_date, "%Y-%m-%d")
            to_date = datetime.datetime.strptime(_to_date, "%Y-%m-%d")
            if from_date and to_date:
                delta = relativedelta.relativedelta(to_date, from_date)
                if delta.years == 0 and delta.months < 4:
                    # Add another month if same month is selected, that way the user doesn't see an error
                    to_date += relativedelta.relativedelta(months=1)
                    results.group_by = ("date",)
                    self.group_by_week = True
                elif delta.years < 3:
                    results.group_by = ("date",)
                    self.group_by_month = True
                qs = qs.filter(date__range=(from_date, to_date))

        # group by specified fields by week/month, otherwise group by year
        group_by_tuple = group_by
        if (hasattr(self, "group_by_month") and self.group_by_month) or (
            hasattr(self, "group_by_week") and self.group_by_week
        ):
            gp_list = list(group_by)
            gp_list.remove("year")
            gp_list.append("date")
            group_by_tuple = tuple(gp_list)
        qs = qs.values(*group_by_tuple)
        qs = qs.annotate(count=Sum("count"))
        for stop in qs:
            data = {}
            if "year" in group_by_tuple:
                data["year"] = stop["year"]

            if "date" in group_by_tuple:
                if hasattr(self, "group_by_month") and self.group_by_month:
                    data["date"] = stop["date"].strftime("%Y-%m")
                if hasattr(self, "group_by_week") and self.group_by_week:
                    data["date"] = stop["date"].strftime("%U")

            if "stop_purpose" in group_by_tuple:
                purpose = PURPOSE_CHOICES.get(stop["stop_purpose"], stop["stop_purpose"])
                data["purpose"] = purpose

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
    queryset = Resource.objects.all()

    def get_serializer_class(self):
        return serializers.ResourcesSerializer(context={"request": self.request})

    @method_decorator(never_cache)
    def list(self, request, *args, **kwargs):
        return Response(
            {
                "results": self.serializer_class(
                    Resource.objects.all(),
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
