# records/serializers.py
from rest_framework import serializers
from .models import FamilyMember, Disease, Vaccine, VaccinationRecord, Appointment

class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = "__all__"

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = "__all__"

class VaccinationRecordSerializer(serializers.ModelSerializer):
    vaccine = VaccineSerializer(read_only=True)
    vaccine_id = serializers.PrimaryKeyRelatedField(queryset=Vaccine.objects.all(), source="vaccine", write_only=True, required=False)
    class Meta:
        model = VaccinationRecord
        fields = ["id","member","disease","dose_number","date","vaccine","vaccine_id","location","note","source"]

class FamilyMemberSerializer(serializers.ModelSerializer):
    vaccinations = VaccinationRecordSerializer(many=True, read_only=True)
    class Meta:
        model = FamilyMember
        fields = ["id","owner","full_name","dob","gender","relation","vaccinations"]
        read_only_fields = ("owner",)

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"
