from nc.models import Agency
from selectable.base import ModelLookup
from selectable.registry import registry


class AgencyLookup(ModelLookup):
    model = Agency
    search_fields = ("name__icontains",)

    def get_queryset(self):
        return super().get_queryset().order_by("name")


registry.register(AgencyLookup)
