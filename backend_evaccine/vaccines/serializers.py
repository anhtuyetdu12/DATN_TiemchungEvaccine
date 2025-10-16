from rest_framework import serializers
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, Booking, VaccinePackageGroup,  VaccinePackageDisease, BookingItem
from django.db.models import Max
from records.models import FamilyMember, VaccinationRecord
from django.core.exceptions import ObjectDoesNotExist
from .models import BookingItem

class DiseaseSerializer(serializers.ModelSerializer):
    dose_count = serializers.SerializerMethodField()

    class Meta:
        model = Disease
        fields = "__all__"

    def get_dose_count(self, obj):  # ← đổi tên cho khớp field
        from django.db.models import Max
        max_doses = obj.vaccines.aggregate(m=Max("doses_required")).get("m") or 1
        return min(max_doses, 5)


class VaccineCategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = VaccineCategory
        fields = "__all__"
        
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class VaccineSerializer(serializers.ModelSerializer):
    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField(queryset=Disease.objects.all(), source="disease", write_only=True)
    category = VaccineCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=VaccineCategory.objects.all(), source="category", write_only=True)
    formatted_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Vaccine
        fields = "__all__"

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_formatted_price(self, obj):
        if obj.price is not None:
            return f"{obj.price:,.0f} VNĐ"
        return "0 VNĐ"

class VaccinePackageDiseaseSerializer(serializers.ModelSerializer):
    disease = DiseaseSerializer()
    vaccines = VaccineSerializer(many=True)

    class Meta:
        model = VaccinePackageDisease
        fields = ["id", "disease", "vaccines"]


class VaccinePackageSerializer(serializers.ModelSerializer):
    disease_groups = VaccinePackageDiseaseSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source="group.title", read_only=True)
    image = serializers.SerializerMethodField()
    class Meta:
        model = VaccinePackage
        fields = [ "id", "name", "slug", "group_name", "description", "status","image",  "disease_groups" ]
        
    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class VaccinePackageGroupSerializer(serializers.ModelSerializer):
    # Lấy luôn danh sách gói thuộc group
    packages = VaccinePackageSerializer(many=True, read_only=True)

    class Meta:
        model = VaccinePackageGroup
        fields = ["id", "title", "description", "order", "status", "packages"]

class BookingItemWriteSerializer(serializers.Serializer):  # NEW
    vaccine_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class BookingItemReadSerializer(serializers.ModelSerializer):
    vaccine = VaccineSerializer(read_only=True)

    class Meta:
        model = BookingItem
        fields = ["id", "vaccine", "quantity", "unit_price"]
        
class BookingSerializer(serializers.ModelSerializer):
    # write-only
    member_id = serializers.PrimaryKeyRelatedField(queryset=FamilyMember.objects.all(), source="member", write_only=True)
    items = BookingItemWriteSerializer(many=True, write_only=True) 

    # read-only
    items_detail = BookingItemReadSerializer(many=True, read_only=True, source="items")
    vaccine = VaccineSerializer(read_only=True)
    package = VaccinePackageSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "member_id", "appointment_date",
            "location", "status", "notes", "vaccine", "package", "created_at",
            "items",           # gửi lên khi tạo
            "items_detail",    # nhận về khi đọc 
            "is_overdue",
        ]
        
    def get_is_overdue(self, obj):
        from datetime import date
        if obj.status in ("completed", "cancelled"):
            return False
        return bool(obj.appointment_date and obj.appointment_date < date.today())

    def validate(self, attrs):
        user = self.context["request"].user
        member = attrs["member"]

        # BẮT BUỘC CÓ NGÀY HẸN
        if not attrs.get("appointment_date"):
            raise serializers.ValidationError({"appointment_date": "Vui lòng chọn ngày hẹn tiêm."})

        if member.user != user:
            raise serializers.ValidationError({"member_id": "Thành viên không thuộc tài khoản này."})

        # gộp quantity theo vaccine & check vượt phác đồ
        from collections import defaultdict
        want = defaultdict(int)
        for it in attrs["items"]:
            want[it["vaccine_id"]] += it["quantity"]

        for v_id, qty in want.items():
            try:
                v = Vaccine.objects.get(id=v_id)
            except Vaccine.DoesNotExist:
                raise serializers.ValidationError({"items": f"Vắc xin id={v_id} không tồn tại"})
            total = v.doses_required or 1
            used = VaccinationRecord.objects.filter(family_member=member, vaccine=v).count()
            if used + qty > total:
                remain = max(total - used, 0)
                raise serializers.ValidationError({
                    "items": f"Vắc xin {v.name}: vượt số liều tối đa ({total}). Còn có thể đặt {remain} liều."
                })
        return attrs
    

    def create(self, validated_data):
        user = self.context["request"].user
        items_data = validated_data.pop("items", [])
        booking = Booking.objects.create(user=user, **validated_data)

        for it in items_data:
            v = Vaccine.objects.get(id=it["vaccine_id"])
            BookingItem.objects.create(
                booking=booking, vaccine=v, quantity=it["quantity"], unit_price=v.price or 0
            )
            # Ghi sổ: mũi mới ở trạng thái CHỜ TIÊM = vaccination_date None, next_dose_date = ngày đặt
            current = VaccinationRecord.objects.filter(
                family_member=booking.member, vaccine=v
            ).count()
            for i in range(it["quantity"]):
                VaccinationRecord.objects.create(
                    family_member=booking.member,
                    disease=v.disease,
                    vaccine=v,
                    dose_number=current + i + 1,
                    vaccination_date=None,                 # <-- chưa tiêm
                    next_dose_date=booking.appointment_date,  # <-- NGÀY ĐẶT HẸN
                    note=f"Đặt lịch #{booking.id}",
                )
        return booking

