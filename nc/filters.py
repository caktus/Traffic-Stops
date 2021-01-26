from rest_framework import generics
from django_filters import rest_framework as filters

from nc.models import Agency, Person


class DriverStopsFilter(filters.FilterSet):
    agency = filters.NumberFilter(label="agency_id", method="filter_agency")

    def filter_agency(self, queryset, name, value):
        return queryset.filter(stop__agency_id=value)

    class Meta:
        model = Person
        fields = ["agency", "type", "age", "gender", "ethnicity"]
