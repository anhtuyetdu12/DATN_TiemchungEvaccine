from rest_framework import serializers
from .models import FamilyMember, VaccinationRecord
from vaccines.serializers import DiseaseSerializer, VaccineSerializer
from vaccines.models import Disease, Vaccine
from datetime import date

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


class VaccinationRecordSerializer(serializers.ModelSerializer):
    family_member = FamilyMemberSerializer(read_only=True)
    family_member_id = serializers.PrimaryKeyRelatedField(queryset=FamilyMember.objects.all(), source="family_member", write_only=True)

    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField(queryset=Disease.objects.all(), source="disease", write_only=True, required=False)

    vaccine = VaccineSerializer(read_only=True)
    vaccine_id = serializers.PrimaryKeyRelatedField(queryset=Vaccine.objects.all(), source="vaccine", write_only=True, required=False)
    status_label = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = VaccinationRecord
        fields = [
            "id", "family_member", "family_member_id",
            "disease", "disease_id", "vaccine", "vaccine_id",
            "dose_number", "vaccine_name", "vaccine_lot",
            "vaccination_date", "next_dose_date", "note","status_label",  
        ]
        
    def get_status_label(self, obj):
        # Chỉ dùng NGÀY
        if obj.vaccination_date:
            return "Đã tiêm"
        if obj.next_dose_date:
            today = date.today()
            if obj.next_dose_date > today:
                return "Chờ tiêm"
            if obj.next_dose_date < today:
                return "Trễ hẹn"
            return "Chờ tiêm"  # đúng ngày hôm nay -> chưa trễ
        return "Chưa tiêm"
    
    def validate(self, attrs):
        request = self.context["request"]
        fm = attrs.get("family_member")
        if fm and fm.user_id != request.user.id:
            raise serializers.ValidationError({"family_member_id": "Thành viên không thuộc tài khoản này."})
        return attrs
    
