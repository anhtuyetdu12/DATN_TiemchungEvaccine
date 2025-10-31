from rest_framework import serializers
from .models import FamilyMember, VaccinationRecord, Booking, BookingItem
from vaccines.serializers import DiseaseSerializer, VaccineSerializer, VaccinePackageSerializer
from vaccines.models import Disease, Vaccine
from datetime import date
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

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
        # Đúng cho VaccinationRecord: dựa vào vaccination_date & next_dose_date
        if obj.vaccination_date:
            return "Đã tiêm"
        if obj.next_dose_date:
            today = timezone.localdate()
            # nếu note có 'Đặt lại lịch' thì ưu tiên cho là Chờ tiêm
            if obj.note and "Đặt lại lịch" in obj.note:
                return "Chờ tiêm"

            if obj.next_dose_date > today:
                return "Chờ tiêm"
            if obj.next_dose_date < today:
                return "Trễ hẹn"
            return "Chờ tiêm"
        return "Chưa tiêm"
        
    def validate(self, attrs):
        request = self.context["request"]
        fm = attrs.get("family_member")
        if fm and fm.user_id != request.user.id:
            raise serializers.ValidationError({"family_member_id": "Thành viên không thuộc tài khoản này."})
        return attrs
    
class BookingItemWriteSerializer(serializers.Serializer):
    vaccine_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=1)

class BookingItemReadSerializer(serializers.ModelSerializer):
    vaccine = VaccineSerializer(read_only=True)
    class Meta:
        model = BookingItem
        fields = ["id", "vaccine", "quantity", "unit_price"]

class UserSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "phone", "full_name",)

class MemberSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("id", "full_name", "date_of_birth", "phone",)

class BookingSerializer(serializers.ModelSerializer):
    # write
    member_id = serializers.PrimaryKeyRelatedField(queryset=FamilyMember.objects.all(), source="member", write_only=True)
    items = BookingItemWriteSerializer(many=True, write_only=True)

    # read
    user = UserSlimSerializer(read_only=True)
    member = MemberSlimSerializer(read_only=True)
    items_detail = BookingItemReadSerializer(many=True, read_only=True, source="items")
    vaccine = VaccineSerializer(read_only=True)
    package = VaccinePackageSerializer(read_only=True)
    items_summary = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "member_id", "appointment_date", "location", "status", "notes",
            "vaccine", "package", "created_at", "status_label",
            "items", "items_detail", "is_overdue",
            "user", "member", "items_summary", 
        ]
        
    def _acting_user(self):
         # Staff đặt thay: context có "acting_user" (chính là customer)
        # KH tự đặt: mặc định là request.user
        return self.context.get("acting_user") or self.context["request"].user

    def get_vaccine_names(self, obj):
        names = [it.vaccine.name for it in obj.items.all() if it.vaccine]
        if names:
            return ", ".join(dict.fromkeys(names))  # unique giữ thứ tự
        if obj.vaccine:
            return obj.vaccine.name
        if obj.package:
            return f"Gói: {obj.package.name}"
        return ""

    def get_items_summary(self, obj):
        summary = []
        for it in obj.items.all():
            if it.vaccine:
                summary.append({"name": it.vaccine.name, "qty": it.quantity})
        return summary
    
    def get_is_overdue(self, obj):
        from datetime import date
        if obj.status in ("completed", "cancelled"):
            return False
        return bool(obj.appointment_date and obj.appointment_date < date.today())
    
    def get_status_label(self, obj):
        if self.get_is_overdue(obj):
            return "Trễ hẹn"
        mapping = {
            "pending": "Chờ xác nhận",
            "confirmed": "Đã xác nhận",
            "completed": "Đã tiêm xong",
            "cancelled": "Đã hủy",
        }
        return mapping.get(obj.status, obj.status)
    
    def validate(self, attrs):
        acting_user = self._acting_user()
        member = attrs["member"]

        if not attrs.get("appointment_date"):
            raise serializers.ValidationError({"appointment_date": "Vui lòng chọn ngày hẹn tiêm."})

        if member.user != acting_user:
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
            used = VaccinationRecord.objects.filter(family_member=member, vaccine=v,  vaccination_date__isnull=False).count()
            if used + qty > total:
                remain = max(total - used, 0)
                raise serializers.ValidationError({
                    "items": f"Vắc xin {v.name}: vượt số liều tối đa ({total}). Còn có thể đặt {remain} liều."
                })
        return attrs

    # def create(self, validated_data):
    #     acting_user = self._acting_user()
    #     items_data = validated_data.pop("items", [])
    #     booking = Booking.objects.create(user=acting_user, **validated_data)

    #     for it in items_data:
    #         v = Vaccine.objects.get(id=it["vaccine_id"])
    #         BookingItem.objects.create(
    #             booking=booking, vaccine=v, quantity=it["quantity"], unit_price=v.price or 0
    #         )
    #         current = VaccinationRecord.objects.filter(family_member=booking.member, vaccine=v).count()
    #         for i in range(it["quantity"]):
    #             VaccinationRecord.objects.create(
    #                 family_member=booking.member,
    #                 disease=v.disease,
    #                 vaccine=v,
    #                 dose_number=current + i + 1,
    #                 vaccination_date=None,
    #                 next_dose_date=booking.appointment_date,
    #                 note=f"Đặt lịch #{booking.id}",
    #             )
    #     return booking
    def create(self, validated_data):
        acting_user = self._acting_user()
        items_data = validated_data.pop("items", [])
        booking = Booking.objects.create(user=acting_user, **validated_data)
        today = timezone.localdate()

        for it in items_data:
            v = Vaccine.objects.get(id=it["vaccine_id"])
            qty = int(it["quantity"] or 1)

            BookingItem.objects.create(
                booking=booking,
                vaccine=v,
                quantity=qty,
                unit_price=v.price or 0,
            )

           # TÌM NHỮNG BẢN GHI TRỄ CŨ CẦN CẬP NHẬT
            overdue_qs = (
                VaccinationRecord.objects
                .filter(
                    family_member=booking.member,
                    vaccination_date__isnull=True,
                    # 👇 nới thành <= cho chắc
                    next_dose_date__lte=today,
                )
                .filter(
                    # 1) trùng bệnh
                    Q(disease=v.disease)
                    # 2) hoặc trùng vaccine
                    | Q(vaccine=v)
                    # 3) hoặc record cũ chỉ lưu tên vắc xin / tên bệnh dạng text
                    | (
                        Q(vaccine__isnull=True) & Q(disease__isnull=True) & (
                            Q(vaccine_name__iexact=v.name)              # trùng hẳn tên vaccine
                            | Q(vaccine_name__icontains=v.name)         # chứa tên vaccine
                            | (v.disease and Q(vaccine_name__icontains=v.disease.name))  # chứa tên bệnh: "Thủy đậu"
                        )
                    )
                )
                .order_by("next_dose_date")
            )

            if overdue_qs.exists():
                target = overdue_qs.first()   # bản trễ cũ nhất/đúng nhất
                target.next_dose_date = booking.appointment_date
                target.note = f"Đặt lại lịch #{booking.id}"
                update_fields = ["next_dose_date", "note"]
                if not target.disease_id and v.disease_id:
                    target.disease = v.disease
                    update_fields.append("disease")
                if not target.vaccine_id:
                    target.vaccine = v
                    update_fields.append("vaccine")
                target.save(update_fields=update_fields)

                # dọn phần còn lại để FE không thấy 2 mũi cùng bệnh
                overdue_qs.exclude(id=target.id).update(next_dose_date=None, note="")  # hoặc giữ nguyên note
            else:
                # không có mũi trễ -> tạo mới như cũ
                current = VaccinationRecord.objects.filter(
                    family_member=booking.member,
                    vaccine=v,
                ).filter(
                    Q(vaccination_date__isnull=False) | Q(next_dose_date__isnull=False)
                ).count()

                VaccinationRecord.objects.create(
                    family_member=booking.member,
                    disease=v.disease,
                    vaccine=v,
                    dose_number=current + 1,
                    vaccination_date=None,
                    next_dose_date=booking.appointment_date,
                    note=f"Đặt lại lịch #{booking.id}",
                )
        return booking
    
#  ----- thành viên gia đình ------
class CustomerMemberSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("id", "full_name", "nickname", "date_of_birth", "gender", "relation", "phone")

class AppointmentSlimSerializer(serializers.Serializer):
    id = serializers.CharField()
    date = serializers.DateField()  # <<< QUAN TRỌNG: DateField (tránh lỗi utcoffset)
    vaccine = serializers.CharField()
    center = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField()
    price = serializers.IntegerField(required=False, default=0)


class HistorySlimSerializer(serializers.Serializer):
    id = serializers.CharField()
    date = serializers.DateField() 
    member_id = serializers.IntegerField()
    member_name = serializers.CharField()
    relation = serializers.CharField(allow_blank=True)
    disease = serializers.CharField(allow_blank=True)
    vaccine = serializers.CharField(allow_blank=True)
    dose = serializers.IntegerField(required=False, default=1)       
    price = serializers.IntegerField(required=False, default=0)      
    note = serializers.CharField(required=False, allow_blank=True)
    status_label = serializers.CharField(required=False, default="Đã tiêm")


class CustomerListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    phone = serializers.CharField(allow_blank=True)
    email = serializers.EmailField()
    dob = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    doses = serializers.IntegerField(required=False)
    appointments = AppointmentSlimSerializer(many=True)
    history = HistorySlimSerializer(many=True)
    # Nếu BE set include=members sẽ tự có key 'members' và FE vẫn đọc được (Serializer không cấm)


class AppointmentCreateInSerializer(serializers.Serializer):
    date = serializers.DateTimeField()  # FE gửi DateTime → BE .date() để gán vào DateField
    vaccineId = serializers.CharField(required=False, allow_blank=True)
    vaccine = serializers.CharField()
    center = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    price = serializers.IntegerField(required=False, default=0)
    doses = serializers.IntegerField(required=False, default=1)
    note = serializers.CharField(required=False, allow_blank=True)


class AppointmentStatusPatchSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["pending", "confirmed", "cancelled", "completed"])


class HistoryCreateInSerializer(serializers.Serializer):
    date = serializers.DateField()
    vaccine = serializers.CharField()
    place = serializers.CharField(required=False, allow_blank=True)
    dose = serializers.CharField(required=False, allow_blank=True)
    batch = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    
class StaffBookingCreateInSerializer(serializers.Serializer):
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=FamilyMember.objects.all(), source="member"
    )
    appointment_date = serializers.DateField()
    items = BookingItemWriteSerializer(many=True)  
    location = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)