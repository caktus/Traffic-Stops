from django.contrib import admin, messages

from tsdata.models import CensusProfile, Dataset, Import, StateFacts, TopAgencyFacts
from tsdata.tasks import import_dataset


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "state", "date_received", "destination")
    list_filter = ("state",)
    ordering = ("-date_received",)
    search_fields = ("name", "url")
    date_hierarchy = "date_received"
    actions = ["import_dataset"]

    @admin.action(description="Import selected dataset")
    def import_dataset(self, request, queryset):
        if queryset.count() > 1:
            self.message_user(request, "Please select one dataset at a time", level=messages.ERROR)
            return
        import_dataset.delay(queryset[0].pk)
        msg = f"{queryset[0].name} successfully queued for import."
        self.message_user(request, msg)


@admin.register(Import)
class ImportAdmin(admin.ModelAdmin):
    list_display = ("id", "dataset", "date_started", "date_finished", "successful")
    list_filter = ("successful",)
    date_hierarchy = "date_started"
    search_fields = ("dataset__name", "dataset__state", "dataset__url")
    ordering = ("-date_started",)


@admin.register(CensusProfile)
class CensusProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "location", "state", "geography", "total", "year", "source")
    list_filter = ("state", "geography", "source", "year")
    search_fields = ("location", "state", "geography")
    ordering = ("location",)


class TopAgencyFactsInline(admin.TabularInline):
    model = TopAgencyFacts

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StateFacts)
class StateFactsAdmin(admin.ModelAdmin):
    inlines = (TopAgencyFactsInline,)

    def has_delete_permission(self, request, obj=None):
        return False
