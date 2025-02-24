from ckeditor.widgets import CKEditorWidget
from django import forms
from django.contrib import admin

from nc.models import (
    Agency,
    ContrabandSummary,
    LikelihoodStopSummary,
    NCCensusProfile,
    Resource,
    ResourceFile,
    StopSummary,
)


class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "census_profile_id")
    search_fields = ("name",)
    ordering = ("id",)


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
    title = forms.CharField(widget=CKEditorWidget())
    description = forms.CharField(widget=CKEditorWidget())

    class Meta:
        model = Resource
        fields = "__all__"


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
        "geography",
        "race",
        "population",
        "population_total",
        "population_pct",
    )
    list_filter = ("geography", "race")
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


@admin.register(LikelihoodStopSummary)
class LikelihoodStopSummaryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "agency_name",
        "driver_race_comb",
        "population",
        "population_total",
        "stops",
        "stops_total",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
    )
    list_filter = ("driver_race_comb", "agency")
    list_select_related = ("agency",)
    readonly_fields = (
        "id",
        "agency",
        "driver_race_comb",
        "population",
        "population_total",
        "population_percent",
        "stops",
        "stops_total",
        "stop_rate",
        "baseline_rate",
        "stop_rate_ratio",
    )
    search_fields = ("agency__name",)
    ordering = ("agency__name", "driver_race_comb")

    @admin.display(ordering="agency__name")
    def agency_name(self, obj):
        return obj.agency.name


admin.site.register(Agency, AgencyAdmin)
admin.site.register(StopSummary, StopSummaryAdmin)
admin.site.register(Resource, ResourceAdmin)
