from nc import models as stops
from rest_framework import serializers
from tsdata.models import StateFacts, TopAgencyFacts


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


class PersonStopSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    gender = serializers.CharField(source="get_gender_display")
    race = serializers.CharField(source="get_race_display")
    ethnicity = serializers.CharField(source="get_ethnicity_display")
    department = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()
    officer_id = serializers.SerializerMethodField()
    stop_purpose = serializers.SerializerMethodField()
    stop_action = serializers.SerializerMethodField()
    stop_id = serializers.SerializerMethodField()

    class Meta:
        model = stops.Person
        fields = (
            "stop_id",
            "person_id",
            "date",
            "gender",
            "race",
            "ethnicity",
            "age",
            "department",
            "department_id",
            "officer_id",
            "stop_purpose",
            "stop_action",
        )

    def get_date(self, obj):
        return obj.stop.date

    def get_department(self, obj):
        return obj.stop.agency.name

    def get_department_id(self, obj):
        return obj.stop.agency_id

    def get_officer_id(self, obj):
        return obj.stop.officer_id

    def get_stop_purpose(self, obj):
        return obj.stop.get_purpose_display()

    def get_stop_action(self, obj):
        return obj.stop.get_action_display()

    def get_stop_id(self, obj):
        return obj.stop.stop_id


class TopAgencyFactsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopAgencyFacts
        fields = ("rank", "agency_id", "stops", "name")


class StateFactsSerializer(serializers.ModelSerializer):
    top_agencies = TopAgencyFactsSerializer(many=True, read_only=True, source="topagencyfacts_set")

    class Meta:
        model = StateFacts
        fields = (
            "state_key",
            "total_stops",
            "total_stops_millions",
            "total_searches",
            "total_agencies",
            "start_date",
            "end_date",
            "top_agencies",
        )


class ContactFormSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    message = serializers.CharField()

    class Meta:
        fields = "__all__"
