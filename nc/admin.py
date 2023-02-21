from django.contrib import admin

from nc.models import Agency, Resource, StopSummary


class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "census_profile_id")


class StopSummaryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "agency_name",
        "year",
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
        "year",
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


class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "agency")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not obj.image:
            obj.image = "forward-justice-logo"
            obj.save()


admin.site.register(Agency, AgencyAdmin)
admin.site.register(StopSummary, StopSummaryAdmin)
admin.site.register(Resource, ResourceAdmin)
