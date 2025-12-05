from rest_framework import serializers
from .models import FamilyMember, VaccinationRecord, Booking, BookingItem, CustomerNotification
from vaccines.serializers import DiseaseSerializer, VaccineSerializer, VaccinePackageSerializer
from vaccines.models import Disease, Vaccine, VaccinePackage
from datetime import date, datetime
from django.db.models import Q, Max
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
            "date_of_birth", "phone", "notes","chronic_note", "created_at"
        ]
        
class VaccinationRecordSerializer(serializers.ModelSerializer):
    family_member = FamilyMemberSerializer(read_only=True)
    family_member_id = serializers.PrimaryKeyRelatedField(queryset=FamilyMember.objects.all(), source="family_member", write_only=True)

    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField(queryset=Disease.objects.all(), source="disease", write_only=True, required=False)

    vaccine = VaccineSerializer(read_only=True)
    vaccine_id = serializers.PrimaryKeyRelatedField(queryset=Vaccine.objects.all(), source="vaccine", write_only=True, required=False)
    # status_label = serializers.SerializerMethodField(read_only=True)
    status_label = serializers.SerializerMethodField()
    locked = serializers.SerializerMethodField(read_only=True)
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = VaccinationRecord
        fields = [
            "id", "family_member", "family_member_id",
            "disease", "disease_id", "vaccine", "vaccine_id",
            "dose_number", "vaccine_name", "vaccine_lot",
            "vaccination_date", "next_dose_date", "note","status_label",  
            "locked", "can_delete"
        ]
    def get_can_delete(self, obj):
        return obj.source_booking_id is None
    
    def get_locked(self, obj):
        # mũi có source_booking là mũi từ booking → khoá xoá
        return obj.source_booking_id is not None
    
    def get_status_label(self, obj: VaccinationRecord) -> str:
        today = timezone.now().date()
        booking = getattr(obj, "source_booking", None)
        # 1. Có ngày tiêm thật → Đã tiêm
        if obj.vaccination_date:
            return "Đã tiêm"
        # 2. Có booking (mũi dự kiến từ lịch hẹn)
        if booking:
            is_overdue = (
                booking.status not in ("completed", "cancelled") and
                obj.next_dose_date is not None and
                obj.next_dose_date < today
            )
            if booking.status == "cancelled":
                return "Chưa tiêm"
            if is_overdue:
                return "Trễ hẹn"
            if booking.status in ("pending", "confirmed"):
                return "Chờ tiêm"
            # fallback nếu status booking lạ mà vẫn có next_dose_date
            if obj.next_dose_date:
                if obj.next_dose_date < today:
                    return "Trễ hẹn"
                return "Chờ tiêm"
            return "Chưa tiêm"
        # 3. Record không gắn booking → dùng thuần theo next_dose_date
        if obj.next_dose_date:
            if obj.next_dose_date < today:
                return "Trễ hẹn"
            return "Chờ tiêm"
        # 4. Không có gì cả
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
        fields = ("id", "full_name", "date_of_birth", "phone","chronic_note",)

class BookingSerializer(serializers.ModelSerializer):
    # --- WRITE ---
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=FamilyMember.objects.all(),
        source="member",
        write_only=True,
    )
    items = BookingItemWriteSerializer(many=True, write_only=True, required=False)

    #  cho phép FE gửi thẳng 1 vaccine hoặc 1 package
    vaccine_id = serializers.PrimaryKeyRelatedField(
        queryset=Vaccine.objects.all(),
        source="vaccine",
        write_only=True,
        required=False,
        allow_null=True,
    )
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=VaccinePackage.objects.all(),
        source="package",
        write_only=True,
        required=False,
        allow_null=True,
    )

    # --- READ ---
    user = UserSlimSerializer(read_only=True)
    member = MemberSlimSerializer(read_only=True)
    chronic_note = serializers.CharField( source="member.chronic_note", read_only=True, allow_blank=True, allow_null=True,)
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
            "vaccine", "vaccine_id", "package", "package_id",
            "created_at", "status_label", "items", "items_detail", "is_overdue",
            "user", "member", "items_summary", "chronic_note",
        ]

    # ----------------- helpers -----------------
    def _acting_user(self):
        # Staff đặt thay: context có "acting_user" (khách)
        # KH tự đặt: mặc định request.user
        return self.context.get("acting_user") or self.context["request"].user

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

    def _get_next_dose_number(self, member, vaccine: Vaccine | None):
        if vaccine and vaccine.disease_id:
            qs = VaccinationRecord.objects.filter(
                family_member=member,
                disease=vaccine.disease,
            )
        else:
            qs = VaccinationRecord.objects.filter(
                family_member=member,
                vaccine=vaccine,
            )

        qs = qs.filter(
            Q(vaccination_date__isnull=False) | Q(next_dose_date__isnull=False)
        )
        last = qs.aggregate(mx=Max("dose_number"))["mx"] or 0
        return last + 1

    # ----------------- validate -----------------
    def validate(self, attrs):
        acting_user = self._acting_user()
        member = attrs["member"]
        # bắt buộc có ngày
        if not attrs.get("appointment_date"):
            raise serializers.ValidationError(
                {"appointment_date": "Vui lòng chọn ngày hẹn tiêm."}
            )
        # Ngày hẹn không được trong quá khứ
        appt_date = attrs.get("appointment_date")
        today = timezone.localdate()
        if appt_date < today:
            raise serializers.ValidationError(
                {"appointment_date": "Ngày hẹn phải từ hôm nay trở đi."}
            )
        # thành viên phải thuộc chủ
        if member.user != acting_user:
            raise serializers.ValidationError(
                {"member_id": "Thành viên không thuộc tài khoản này."}
            )
        items = attrs.get("items") or []
        vaccine = attrs.get("vaccine")
        package = attrs.get("package")
        if not items and not vaccine and not package:
            raise serializers.ValidationError(
                {"items": "Vui lòng chọn vắc xin hoặc gói vắc xin."}
            )
        # ===== Validate items (nhiều vaccine) =====
        if items:
            from collections import defaultdict
            want = defaultdict(int)
            seen = set()
            for it in items:
                v_id = it["vaccine_id"]
                #  không cho 1 vaccine xuất hiện nhiều hơn 1 item
                if v_id in seen:
                    raise serializers.ValidationError({ "items": "Mỗi vắc xin chỉ được chọn 1 lần trong một lịch hẹn." })
                seen.add(v_id)
                
                if it["quantity"] != 1:
                    raise serializers.ValidationError({
                        "items": "Mỗi lần đặt lịch chỉ được chọn tối đa 1 liều cho mỗi vắc xin."
                    })
                want[it["vaccine_id"]] += it["quantity"]

            for v_id, qty in want.items():
                try:
                    v = Vaccine.objects.get(id=v_id)
                except Vaccine.DoesNotExist:
                    raise serializers.ValidationError(
                        {"items": f"Vắc xin id={v_id} không tồn tại"}
                    )
                disease = getattr(v, "disease", None)
                total = (
                    getattr(disease, "doses_required", None)
                    or getattr(v, "doses_required", None) 
                    or 1
                )
                # tính tổng mũi của mọi vaccine cùng disease:
                if disease:
                    used = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccination_date__isnull=False
                    ).filter(
                        Q(disease=disease) | Q(vaccine__disease=disease)
                    ).count()
                else:
                    used = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccine=v,                 # hoặc vaccine
                        vaccination_date__isnull=False
                    ).count()
                if used + qty > total:
                    remain = max(total - used, 0)
                    raise serializers.ValidationError({
                        "items": (
                            f"Vắc xin {v.name}: vượt số liều tối đa ({total}). "
                            f"Còn có thể đặt {remain} liều."
                        )
                    })
        # ===== Validate 1 vaccine đơn (vaccine_id) =====
        if vaccine:
            disease = getattr(vaccine, "disease", None)
            total = (
                getattr(disease, "doses_required", None)
                or getattr(vaccine, "doses_required", None)
                or 1
            )
            if disease:
                used = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccination_date__isnull=False
                ).filter(
                    Q(disease=disease) | Q(vaccine__disease=disease)
                ).count()
            else:
                used = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=vaccine,                 
                    vaccination_date__isnull=False
                ).count()
            if used + 1 > total:
                remain = max(total - used, 0)
                raise serializers.ValidationError({
                    "vaccine_id": (
                        f"Vắc xin {vaccine.name}: vượt số liều tối đa ({total}). "
                        f"Còn có thể đặt {remain} liều."
                    )
                })

        # --- Kiểm tra không đặt lịch sớm hơn lịch phác đồ (nếu có) ---
        if appt_date:
            # CASE: items (nhiều vaccine)
            for it in items:
                v_id = it["vaccine_id"]
                try:
                    v = Vaccine.objects.get(id=v_id)
                except Vaccine.DoesNotExist:
                    continue
                disease = getattr(v, "disease", None)
                if disease:
                    base_qs = VaccinationRecord.objects.filter(
                        family_member=member,
                        disease=disease,
                        vaccination_date__isnull=True,
                        next_dose_date__isnull=False,
                    )
                else:
                    base_qs = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccine=v,
                        vaccination_date__isnull=True,
                        next_dose_date__isnull=False,
                    )
                next_planned = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    vaccination_date__isnull=True,
                    next_dose_date__isnull=False,
                ).order_by("next_dose_date").first()

                # if next_planned and appt_date < next_planned.next_dose_date:
                #     raise serializers.ValidationError({
                #         "appointment_date": (
                #             f"Vắc xin {v.name}: mũi tiếp theo theo phác đồ "
                #             f"nên tiêm từ ngày {next_planned.next_dose_date.strftime('%d/%m/%Y')}. "
                #             f"Vui lòng chọn ngày muộn hơn."
                #         )
                #     })
                next_planned = base_qs.order_by("next_dose_date").first()
                if next_planned and appt_date < next_planned.next_dose_date:
                    raise serializers.ValidationError({
                        "appointment_date": (
                            f"Vắc xin {v.name}: mũi tiếp theo theo phác đồ "
                            f"nên tiêm từ ngày {next_planned.next_dose_date.strftime('%d/%m/%Y')}. "
                            f"Vui lòng chọn ngày muộn hơn."
                        )
                    })


            # CASE: vaccine đơn (gửi vaccine_id riêng)
            if vaccine:
                disease = getattr(vaccine, "disease", None)
                if disease:
                    base_qs = VaccinationRecord.objects.filter(
                        family_member=member,
                        disease=disease,
                        vaccination_date__isnull=True,
                        next_dose_date__isnull=False,
                    )
                else:
                    base_qs = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccine=vaccine,
                        vaccination_date__isnull=True,
                        next_dose_date__isnull=False,
                    )

                # next_planned = VaccinationRecord.objects.filter(
                #     family_member=member,
                #     vaccine=vaccine,
                #     vaccination_date__isnull=True,
                #     next_dose_date__isnull=False,
                # ).order_by("next_dose_date").first()

                # if next_planned and appt_date < next_planned.next_dose_date:
                #     raise serializers.ValidationError({
                #         "appointment_date": (
                #             f"Vắc xin {vaccine.name}: mũi tiếp theo theo phác đồ "
                #             f"nên tiêm từ ngày {next_planned.next_dose_date.strftime('%d/%m/%Y')}. "
                #             f"Vui lòng chọn ngày muộn hơn."
                #         )
                #     })
                next_planned = base_qs.order_by("next_dose_date").first()
                if next_planned and appt_date < next_planned.next_dose_date:
                    raise serializers.ValidationError({
                        "appointment_date": (
                            f"Vắc xin {vaccine.name}: mũi tiếp theo theo phác đồ "
                            f"nên tiêm từ ngày {next_planned.next_dose_date.strftime('%d/%m/%Y')}. "
                            f"Vui lòng chọn ngày muộn hơn."
                        )
                    })

        return attrs

    # ----------------- create -----------------
    def create(self, validated_data):
        acting_user = self._acting_user()
        items_data = validated_data.pop("items", [])
        vaccine = validated_data.pop("vaccine", None)
        package = validated_data.pop("package", None)

        booking = Booking.objects.create(user=acting_user, vaccine=vaccine, package=package, **validated_data)
        today = timezone.localdate()
        # ===== CASE 1: có items (giữ nguyên logic cũ) =====
        if items_data:
            for it in items_data:
                v = Vaccine.objects.get(id=it["vaccine_id"])
                qty = int(it["quantity"] or 1)

                BookingItem.objects.create(
                    booking=booking,
                    vaccine=v,
                    quantity=qty,
                    unit_price=v.price or 0,
                )
                # ---- cập nhật / tạo VaccinationRecord như bạn đã làm ----
                name_cond = Q(vaccine_name__iexact=v.name) | Q(vaccine_name__icontains=v.name)
                if v.disease_id:
                    name_cond |= Q(vaccine_name__icontains=v.disease.name)

                overdue_qs = (
                    VaccinationRecord.objects
                    .filter(
                        family_member=booking.member,
                        vaccination_date__isnull=True,
                        next_dose_date__lte=today,
                    )
                    .filter(
                        Q(disease=v.disease)
                        | Q(vaccine=v)
                        | (
                            Q(vaccine__isnull=True)
                            & Q(disease__isnull=True)
                            & name_cond
                        )
                    )
                    .order_by("next_dose_date")
                )
                if overdue_qs.exists():
                    target = overdue_qs.first()
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
                    overdue_qs.exclude(id=target.id).update(next_dose_date=None, note="")
                else:
                    # current = VaccinationRecord.objects.filter(
                    #     family_member=booking.member,
                    #     vaccine=v,
                    # ).filter(
                    #     Q(vaccination_date__isnull=False) | Q(next_dose_date__isnull=False)
                    # ).count()
                    dose_number = self._get_next_dose_number(booking.member, v)

                    VaccinationRecord.objects.create(
                        family_member=booking.member,
                        disease=v.disease,
                        vaccine=v,
                        dose_number=dose_number,
                        vaccination_date=None,
                        next_dose_date=booking.appointment_date,
                        note=f"Đặt lại lịch #{booking.id}",
                        source_booking=booking,
                    )
            return booking
        # ===== CASE 2: không có items nhưng có 1 vaccine =====
        if vaccine:
            BookingItem.objects.create(
                booking=booking,
                vaccine=vaccine,
                quantity=1,
                unit_price=vaccine.price or 0,
            )
            # cập nhật mũi trễ / tạo mới giống trên
            name_cond = Q(vaccine_name__iexact=vaccine.name) | Q(vaccine_name__icontains=vaccine.name)
            if vaccine.disease_id:
                name_cond |= Q(vaccine_name__icontains=vaccine.disease.name)

            overdue_qs = (
                VaccinationRecord.objects
                .filter(
                    family_member=booking.member,
                    vaccination_date__isnull=True,
                    next_dose_date__lte=today,
                )
                .filter(
                    Q(disease=vaccine.disease)
                    | Q(vaccine=vaccine)
                    | (
                        Q(vaccine__isnull=True)
                        & Q(disease__isnull=True)
                        & name_cond
                    )
                )
                .order_by("next_dose_date")
            )
            if overdue_qs.exists():
                target = overdue_qs.first()
                target.next_dose_date = booking.appointment_date
                target.note = f"Đặt lại lịch #{booking.id}"
                update_fields = ["next_dose_date", "note"]
                if not target.disease_id and vaccine.disease_id:
                    target.disease = vaccine.disease
                    update_fields.append("disease")
                if not target.vaccine_id:
                    target.vaccine = vaccine
                    update_fields.append("vaccine")
                target.save(update_fields=update_fields)
                overdue_qs.exclude(id=target.id).update(next_dose_date=None, note="")
            else:
                dose_number = self._get_next_dose_number(booking.member, vaccine)
                VaccinationRecord.objects.create(
                    family_member=booking.member,
                    disease=vaccine.disease,
                    vaccine=vaccine,
                    dose_number=dose_number,
                    vaccination_date=None,
                    next_dose_date=booking.appointment_date,
                    note=f"Đặt lại lịch #{booking.id}",
                    source_booking=booking,
                )
            return booking

        # ===== CASE 3: package =====
        return booking
    
#  ----- thành viên gia đình ------
class CustomerMemberSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("id", "full_name", "nickname", "date_of_birth", "gender", "relation", "phone", "chronic_note")

class AppointmentSlimSerializer(serializers.Serializer):
    id = serializers.CharField()
    date = serializers.DateField()  
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
    batch = serializers.CharField(required=False, allow_blank=True)
    status_label = serializers.CharField(required=False, default="Đã tiêm")
    locked = serializers.BooleanField(required=False, default=False)
    can_delete = serializers.BooleanField(required=False, default=True)
    

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
    member_id = serializers.IntegerField(required=False, allow_null=True)
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
    

class CustomerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerNotification
        fields = ["id", "title", "message", "channels", "audience", "is_read", "created_at", "meta", "related_booking_id"]
      
      
class MyUpdateHistoryByDiseaseInSerializer(serializers.Serializer):
    member_id = serializers.IntegerField()
    disease_id = serializers.IntegerField()
    doses = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True,
    )

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user 
        member_id = attrs["member_id"]
        disease_id = attrs["disease_id"]

        member = FamilyMember.objects.filter(id=member_id, user=user).first()
        if not member:
            raise serializers.ValidationError({"member_id": "Thành viên không thuộc tài khoản này."})

        disease = Disease.objects.filter(id=disease_id).first()
        if not disease:
            raise serializers.ValidationError({"disease_id": "Bệnh không tồn tại."})

        attrs["member"] = member
        attrs["disease"] = disease

        # validate doses
        cleaned = []
        for idx, d in enumerate(attrs["doses"], start=1):
            date_str = (d.get("date") or "").strip()
            vaccine_name = (d.get("vaccine") or "").strip()
            place = (d.get("location") or "").strip()

            if not date_str and not vaccine_name and not place:
                # mũi trống hoàn toàn → bỏ qua
                continue

            if not date_str:
                raise serializers.ValidationError({
                    "doses": f"Mũi thứ {idx}: vui lòng chọn ngày tiêm."
                })

            try:
                date_val = datetime.fromisoformat(date_str).date()
            except Exception:
                raise serializers.ValidationError({
                    "doses": f"Mũi thứ {idx}: ngày không hợp lệ."
                })

            if date_val > timezone.localdate():
                raise serializers.ValidationError({
                    "doses": f"Mũi thứ {idx}: ngày tiêm không được lớn hơn hôm nay."
                })

            cleaned.append({
                "dose_number": idx,
                "date": date_val,
                "vaccine_name": vaccine_name,
                "place": place,
            })

        attrs["clean_doses"] = cleaned
        return attrs

