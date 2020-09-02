from nc import models as stops
from rest_framework import serializers


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = stops.Agency
        fields = (
            "id",
            "name",
            "census_profile",
        )
