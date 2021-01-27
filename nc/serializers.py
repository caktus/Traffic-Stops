from nc import models as stops
from rest_framework import serializers


class AgencySerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        agency = {
            "id": instance.id,
            "name": instance.name,
            "last_reported_stop": instance.last_reported_stop,
        }
        if not self.parent:
            agency["census_profile"] = instance.census_profile

        return agency

    class Meta:
        model = stops.Agency
        fields = (
            "id",
            "name",
        )
