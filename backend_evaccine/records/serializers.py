from rest_framework import serializers
from .models import FamilyMember, Appointment, VaccinationRecord

class FamilyMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = FamilyMember
        fields = [
            "id", "user_id", "user_email", "user_phone",
            "full_name", "nickname", "relation", "gender",
            "date_of_birth", "phone", "notes", "created_at"
        ]
class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'


class VaccinationRecordSerializer(serializers.ModelSerializer):
    family_member = FamilyMemberSerializer(read_only=True)
    family_member_id = serializers.PrimaryKeyRelatedField(
        queryset=FamilyMember.objects.all(), source="family_member", write_only=True
    )

    class Meta:
        model = VaccinationRecord
        fields = [
            "id", "family_member", "family_member_id", "vaccine_name",
            "vaccine_lot", "vaccination_date", "next_dose_date", "note"
        ]