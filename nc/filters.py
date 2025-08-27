from datetime import timedelta

from django.db.models import Q
from django_filters import rest_framework as filters

from nc import models


class DriverStopsFilter(filters.FilterSet):
    agency = filters.ModelChoiceFilter(
        queryset=models.Agency.objects.all(),
        label="Agency",
        method="filter_agency",
        required=True,
    )
    stop_date = filters.DateFromToRangeFilter(label="Stop date", method="filter_stop_date")
    gender = filters.MultipleChoiceFilter(choices=models.GENDER_CHOICES)
    race = filters.MultipleChoiceFilter(choices=models.RACE_CHOICES)
    ethnicity = filters.MultipleChoiceFilter(choices=models.ETHNICITY_CHOICES)
    stop_officer_id = filters.CharFilter(label="Officer ID", method="filter_officer")
    stop_purpose = filters.MultipleChoiceFilter(
        label="Stop purpose", choices=models.PURPOSE_CHOICES, method="filter_stop_purpose"
    )
    stop_action = filters.MultipleChoiceFilter(
        label="Stop action", choices=models.ACTION_CHOICES, method="filter_stop_action"
    )
    age = filters.NumberFilter(method="filter_age")

    def filter_agency(self, queryset, name, value):
        return queryset.filter(stop__agency_id=value)

    def filter_stop_date(self, queryset, name, value):
        start_date = value.start
        end_date = value.stop
        query = Q()
        if start_date:
            # Adjust it to 2 days earlier
            adjusted_start_date = start_date - timedelta(2)
            query &= Q(stop__date__gte=adjusted_start_date)
            if self.request:
                self.request.adjusted_start_date = start_date.date(), adjusted_start_date.date()
        if end_date:
            # Adjust it to 2 days later
            adjusted_end_date = end_date + timedelta(2)
            query &= Q(stop__date__lte=adjusted_end_date)
            if self.request:
                self.request.adjusted_end_date = end_date.date(), adjusted_end_date.date()
        return queryset.filter(query)

    def filter_officer(self, queryset, name, value):
        return queryset.filter(stop__officer_id=value)

    def filter_stop_purpose(self, queryset, name, value):
        return queryset.filter(stop__purpose__in=value)

    def filter_stop_action(self, queryset, name, value):
        return queryset.filter(stop__action__in=value)

    def filter_age(self, queryset, name, value):
        # Instead of searching for the exact age specified, search for age +/- 2 years
        value = int(value)
        age_range = max(value - 2, 0), value + 2
        if self.request:
            self.request.adjusted_age = value, age_range
        return queryset.filter(age__gte=age_range[0], age__lte=age_range[1])

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
