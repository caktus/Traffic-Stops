import datetime as dt

from django.db.models import Q

from rest_framework import generics
from django_filters import rest_framework as filters

from nc import models


class DriverStopsFilter(filters.FilterSet):
    agency = filters.NumberFilter(label="Agency ID", method="filter_agency")
    stop_date = filters.DateFromToRangeFilter(label="Stop date", method="filter_stop_date")
    gender = filters.MultipleChoiceFilter(choices=models.GENDER_CHOICES)
    race = filters.MultipleChoiceFilter(choices=models.RACE_CHOICES)
    ethnicity = filters.MultipleChoiceFilter(choices=models.ETHNICITY_CHOICES)
    stop_officer_id = filters.CharFilter()
    stop_purpose = filters.MultipleChoiceFilter(
        label="Stop purpose", choices=models.PURPOSE_CHOICES, method="filter_stop_purpose"
    )
    stop_action = filters.MultipleChoiceFilter(
        label="Stop action", choices=models.ACTION_CHOICES, method="filter_stop_action"
    )

    def filter_agency(self, queryset, name, value):
        return queryset.filter(stop__agency_id=value)

    def filter_stop_date(self, queryset, name, value):
        start_date = value.start
        end_date = value.stop
        query = Q()
        if start_date:
            query &= Q(stop__date__gte=start_date)
        if end_date:
            query &= Q(stop__date__lte=end_date)
        return queryset.filter(query)

    def filter_stop_purpose(self, queryset, name, value):
        return queryset.filter(stop__purpose__in=value)

    def filter_stop_purpose(self, queryset, name, value):
        return queryset.filter(stop__action__in=value)

    class Meta:
        model = models.Person
        fields = (
            "agency",
            "stop_date",
            "age",
            "gender",
            "race",
            "ethnicity",
            "stop_officer_id",
            "stop_purpose",
            "stop_action",
        )
