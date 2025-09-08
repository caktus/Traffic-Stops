from django import forms
from django.contrib import admin
from django_ckeditor_5.widgets import CKEditor5Widget

from nc.models import (
    Agency,
    ContrabandSummary,
    NCCensusProfile,
    Resource,
    ResourceFile,
    StopSummary,
)


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "census_profile_id")
    search_fields = ("name",)
    ordering = ("id",)


@admin.register(StopSummary)
class StopSummaryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "agency_name",
        "date",
        "stop_purpose",
        "engage_force",
        "search_type",
        "contraband_found",
        "officer_id",
        "driver_race",
        "driver_ethnicity",
        "count",
    )
    list_filter = (
        "stop_purpose",
        "engage_force",
        "search_type",
        "contraband_found",
        "agency",
    )
    list_select_related = ("agency",)
    search_fields = (
        "id",
        "count",
        "officer_id",
        "agency__name",
    )
    ordering = ("id",)

    def agency_name(self, obj):
        return obj.agency.name


@admin.register(ContrabandSummary)
class ContrabandSummaryAdmin(admin.ModelAdmin):
    date_hierarchy = "date"
    list_display = (
        "id",
        "date",
        "agency",
        "stop_purpose_group",
        "driver_searched",
        "driver_arrest",
        "contraband_found",
    )
    list_filter = ("date", "stop_purpose_group")
    list_select_related = ("agency",)
    search_fields = ("id", "agency__name")
    raw_id_fields = ("stop", "agency", "search", "contraband")


class InlineResourceFile(admin.StackedInline):
    model = ResourceFile
    fields = (
        "name",
        "file",
    )
    extra = 0


class ResourceForm(forms.ModelForm):
    # https://django-ckeditor.readthedocs.io/en/latest/#widget
    title = forms.CharField(widget=CKEditor5Widget())
    description = forms.CharField(widget=CKEditor5Widget())

    class Meta:
        model = Resource
        fields = "__all__"


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    fields = (
        "agencies",
        "title",
        "description",
        "publication_date",
        "created_date",
        "image",
        "view_more_link",
    )
    list_display = (
        "__str__",
        "created_date",
        "publication_date",
    )
    filter_horizontal = ("agencies",)
    inlines = [InlineResourceFile]
    readonly_fields = ("created_date",)
    form = ResourceForm

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not obj.image:
            obj.image = "forward-justice-logo"
            obj.save()

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.instance.agencies.set(form.cleaned_data["agencies"], clear=True)


@admin.register(NCCensusProfile)
class NCCensusProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "acs_id",
        "location",
        "year",
        "geography",
        "race",
        "population",
        "population_total",
        "population_pct",
    )
    list_filter = ("geography", "race", "year")
    ordering = ("location",)
    readonly_fields = (
        "acs_id",
        "location",
        "geography",
        "race",
        "population",
        "population_total",
        "population_percent",
        "source",
    )
    search_fields = ("location", "id", "acs_id")

    @admin.display(ordering="population_percent")
    def population_pct(self, obj):
        return f"{obj.population_percent:.2%}"
