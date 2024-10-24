from ckeditor.widgets import CKEditorWidget
from django import forms
from django.contrib import admin

from nc.models import Agency, Resource, ResourceFile, StopSummary


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


admin.site.register(Agency, AgencyAdmin)
admin.site.register(StopSummary, StopSummaryAdmin)
admin.site.register(Resource, ResourceAdmin)
