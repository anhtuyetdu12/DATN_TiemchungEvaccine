from rest_framework import serializers
from .models import FamilyMember, VaccinationRecord, Booking, BookingItem, CustomerNotification
from vaccines.serializers import DiseaseSerializer, VaccineSerializer, VaccinePackageSerializer
from vaccines.models import Disease, Vaccine, VaccinePackage
from inventory.models import VaccineStockLot
from django.db.models import Sum
from datetime import date, datetime
from django.db.models import Q, Max
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class FamilyMemberSerializer(serializers.ModelSerializer):
    """
    FamilyMemberSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com
    Created: 2025-09-25
    Last Modified: 2025-11-30

    Purpose:
        Chuẩn hóa dữ liệu thành viên gia đình cho FE (customer/staff).

    Output:
        - Đính kèm thông tin user (id/email/phone) dạng read_only
        - Trả các trường cơ bản: họ tên, quan hệ, giới tính, ngày sinh, ghi chú

    Notes:
        - user_* lấy từ quan hệ FK user để FE khỏi phải call thêm endpoint.
    """

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
    """
    VaccinationRecordSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com
    Created: 2025-09-25
    Last Modified: 2025-11-30

    Purpose:
        Serialize sổ tiêm (mũi đã tiêm + mũi dự kiến) theo từng FamilyMember.

    Business Rules:
        - status_label:
            + Nếu có vaccination_date -> 'Đã tiêm'
            + Nếu sinh từ booking (source_booking) -> dựa booking.status + overdue theo next_dose_date
            + Nếu record thủ công -> dựa vào next_dose_date so với today
        - locked/can_delete:
            + Record sinh từ booking -> locked=True, can_delete=False
            + Record thủ công -> can_delete=True

    Security:
        - validate(): member phải thuộc request.user
    """
    family_member = FamilyMemberSerializer(read_only=True)
    family_member_id = serializers.PrimaryKeyRelatedField(queryset=FamilyMember.objects.all(), source="family_member", write_only=True)
    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField(queryset=Disease.objects.all(), source="disease", write_only=True, required=False)
    vaccine = VaccineSerializer(read_only=True)
    vaccine_id = serializers.PrimaryKeyRelatedField(queryset=Vaccine.objects.all(), source="vaccine", write_only=True, required=False)
    status_label = serializers.SerializerMethodField()
    locked = serializers.SerializerMethodField(read_only=True)
    can_delete = serializers.SerializerMethodField()
    source_booking_id = serializers.IntegerField(source="source_booking.id", read_only=True)
    source_booking_status = serializers.CharField(source="source_booking.status", read_only=True)
    source_booking_appointment_date = serializers.DateField(source="source_booking.appointment_date", read_only=True)
    
    class Meta:
        model = VaccinationRecord
        fields = [
            "id", "family_member", "family_member_id",
            "disease", "disease_id", "vaccine", "vaccine_id",
            "dose_number", "vaccine_name", "vaccine_lot",
            "vaccination_date", "next_dose_date", "note","status_label",  
            "locked", "can_delete", "location",
            "source_booking_id", "source_booking_status", "source_booking_appointment_date",
        ]
    
    def get_can_delete(self, obj):
        """
        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com

        Rule:
            Chỉ cho xoá mũi tạo thủ công (record không gắn source_booking).
        """
        return obj.source_booking_id is None
    
    def get_locked(self, obj):
        """
        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com

        Rule:
            Khoá thao tác (UI/BE) nếu record được sinh từ booking.
        """
        return obj.source_booking_id is not None
    
    def get_status_label(self, obj: VaccinationRecord) -> str:
        """
        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com

        Mục đích:
            Trả nhãn trạng thái mũi tiêm để FE hiển thị.
        Priority:
            1) vaccination_date != None  => 'Đã tiêm'
            2) Có source_booking         => dựa vào booking.status + overdue theo next_dose_date
            3) Không có booking          => dựa vào next_dose_date so với today
            4) Không có dữ liệu          => 'Chưa tiêm'
        """
        today = timezone.now().date()
        booking = getattr(obj, "source_booking", None)
        if obj.vaccination_date:
            return "Đã tiêm"
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
            if obj.next_dose_date:
                if obj.next_dose_date < today:
                    return "Trễ hẹn"
                return "Chờ tiêm"
            return "Chưa tiêm"
        if obj.next_dose_date:
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
    """
    BookingItemWriteSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com
    Created: 2025-09-25
    Last Modified: 2025-11-30

    Purpose:
        Input format từ FE khi tạo booking (list vaccine + quantity).

    Rules:
        - quantity giới hạn = 1 theo nghiệp vụ đặt lịch (mỗi vaccine tối đa 1 liều/lần đặt).
    """
    vaccine_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=1)

class BookingItemReadSerializer(serializers.ModelSerializer):
    """
    BookingItemReadSerializer
    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com
    Created: 2025-09-25
    Last Modified: 2025-11-30

    Purpose:
        Output chi tiết item vaccine trong booking (dùng cho màn chi tiết lịch hẹn).
    Business Rules:
        - _get_related_record():
            + Ưu tiên VaccinationRecord có source_booking=booking và vaccine trùng (nguồn chuẩn)
            + Fallback sang record planned có next_dose_date=appointment_date (dữ liệu legacy)
        - get_can_complete():
            + Không cho complete nếu đã có vaccination_date
            + Chỉ cho complete nếu có allocations reserved và lot còn hạn
        - get_cannot_complete_reason():
            + Trả message rõ ràng để staff xử lý (hết kho / hết hạn / chưa giữ kho / đã tiêm)
    """
    vaccine = VaccineSerializer(read_only=True)
    status_label = serializers.SerializerMethodField()
    vaccination_date = serializers.SerializerMethodField()
    next_dose_date = serializers.SerializerMethodField()
    can_complete = serializers.SerializerMethodField()
    cannot_complete_reason = serializers.SerializerMethodField()

    class Meta:
        model = BookingItem
        fields = [  "id", "vaccine", "quantity", "unit_price",
            "status_label", "vaccination_date", "next_dose_date",
            "can_complete", "cannot_complete_reason", ]
        
    def _get_related_record(self, obj):
        booking = obj.booking
        v = obj.vaccine
        rec = (VaccinationRecord.objects
            .filter(family_member=booking.member, source_booking=booking, vaccine=v)
            .order_by("-vaccination_date", "-id")
            .first()
        )
        if rec:
            return rec
        return (VaccinationRecord.objects
            .filter(
                family_member=booking.member,
                vaccine=v,
                vaccination_date__isnull=True,
                next_dose_date=booking.appointment_date,
            )
            .order_by("-id")
            .first()
        )
    
    def get_vaccination_date(self, obj):
        """ Lấy ngày tiêm thực tế từ VaccinationRecord (nếu có)."""
        rec = self._get_related_record(obj)
        return rec.vaccination_date if rec else None

    def get_next_dose_date(self, obj):
        """ Lấy ngày hẹn/dự kiến tiêm từ VaccinationRecord (nếu có)."""
        rec = self._get_related_record(obj)
        return rec.next_dose_date if rec else None

    def get_status_label(self, obj):
        rec = self._get_related_record(obj)
        if rec:
            return VaccinationRecordSerializer(rec, context=self.context).data["status_label"]
        booking = obj.booking
        mapping = {
            "pending": "Chờ xác nhận",
            "confirmed": "Đã xác nhận",
            "completed": "Đã tiêm xong",
            "cancelled": "Đã hủy",
        }
        return mapping.get(booking.status, booking.status)

    def get_can_complete(self, obj):
        """
        Author: Du Thi Anh Tuyet
        Rule: Một item được phép "hoàn thành mũi" khi:
            1) Chưa có vaccination_date (nếu đã tiêm rồi => không cho hoàn thành lại)
            2) Có allocation ở trạng thái reserved (đã giữ kho)
            3) Lot hợp lệ và expiry_date >= today

        Lý do:
            - Tránh hoàn thành mũi khi chưa có giữ kho
            - Tránh dùng lô hết hạn
        """
        # 1) Nếu đã có record tiêm rồi -> không cho hoàn thành nữa
        rec = self._get_related_record(obj)
        if rec and rec.vaccination_date:
            return False
        # 2) Còn lại mới kiểm tra allocation
        today = timezone.localdate()
        allocs = obj.allocations.filter(status="reserved").select_related("lot")
        if not allocs.exists():
            return False
        for alloc in allocs:
            lot = alloc.lot
            if not lot or not lot.expiry_date:
                return False
            if lot.expiry_date < today:
                return False
        return True

    def get_cannot_complete_reason(self, obj):
        rec = self._get_related_record(obj)
        if rec and rec.vaccination_date:
            d = rec.vaccination_date.strftime("%d/%m/%Y")
            return f"Mũi này đã được tiêm ngày {d}."
        today = timezone.localdate()
        allocs = obj.allocations.filter(status="reserved").select_related("lot")
        if not allocs.exists():
            v = obj.vaccine
            if not v:
                return "Mũi này chưa được giữ vắc xin trong kho (chưa xác nhận kho hoặc đã bị hủy)."
            all_qs = VaccineStockLot.objects.filter(
                vaccine=v,
                is_active=True,
            )
            total_all = all_qs.aggregate(total=Sum("quantity_available"))["total"] or 0
            usable_qs = all_qs.filter(expiry_date__gte=today)
            usable_total = usable_qs.aggregate(total=Sum("quantity_available"))["total"] or 0
            if total_all == 0:
                return f"Vắc xin {v.name} hiện đã hết số lượng trong kho."
            if usable_total == 0:
                return (
                    f"Tất cả các lô của vắc xin {v.name} "
                    f"đã hết hạn sử dụng trước ngày tiêm."
                )
            return "Mũi này chưa được giữ vắc xin trong kho (chưa xác nhận kho hoặc đã bị hủy)."
        expired_lots = []
        invalid_lots = []
        for alloc in allocs:
            lot = alloc.lot
            if not lot or not lot.expiry_date:
                invalid_lots.append(lot.lot_number if lot else "?")
                continue
            if lot.expiry_date < today:
                expired_lots.append(lot.lot_number)
        if expired_lots:
            return (  "Các lô sau đã hết hạn trước ngày tiêm: "  + ", ".join(expired_lots) + ". Vui lòng nhập lô mới hoặc đặt lại lịch.")

        if invalid_lots:
            return ( "Có lô vắc xin không hợp lệ: " + ", ".join(invalid_lots) + ". Vui lòng kiểm tra lại kho." )
        return ""

class UserSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "phone", "full_name",)

class MemberSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("id", "full_name", "date_of_birth", "phone","chronic_note",)

class BookingSerializer(serializers.ModelSerializer):
    """
    BookingSerializer
    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com
    Created: 2025-09-25
    Last Modified: 2025-11-30

    Purpose:
        Serialize Booking (lịch hẹn tiêm):
            - Tạo booking (input: member_id + items/vaccine/package)
            - Xem chi tiết booking (output: user, member, items_detail, status_label...)
    Business Rules:
        - get_is_overdue:
            + booking chưa completed/cancelled và appointment_date < today => overdue
        - validate (create booking):
            + appointment_date bắt buộc, không được quá khứ
            + member phải thuộc acting_user (staff đặt thay hoặc khách tự đặt)
            + phải chọn items hoặc vaccine hoặc package
            + chặn đặt trùng lịch cùng ngày (pending/confirmed) theo vaccine/disease
            + chặn vượt số liều tối đa theo phác đồ (doses_required)
            + chặn đặt quá sớm theo phác đồ (interval_days)
    Notes:
        - acting_user lấy từ context["acting_user"] nếu staff đặt thay.
        - items_detail đọc từ BookingItemReadSerializer để show status từng mũi.
    """
    member_id = serializers.PrimaryKeyRelatedField( queryset=FamilyMember.objects.all(),source="member", write_only=True,)
    items = BookingItemWriteSerializer(many=True, write_only=True, required=False)
    vaccine_id = serializers.PrimaryKeyRelatedField(queryset=Vaccine.objects.all(),source="vaccine", write_only=True, required=False, allow_null=True, )
    package_id = serializers.PrimaryKeyRelatedField( queryset=VaccinePackage.objects.all(), source="package",write_only=True,required=False, allow_null=True,)

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
            "user", "member", "items_summary", "chronic_note","completed_at",
        ]

    def _acting_user(self):
        """
        Author: Du Thi Anh Tuyet
        Staff đặt thay: context["acting_user"] là khách.
        Khách tự đặt: dùng request.user.
        """
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

    def validate(self, attrs):
        """
        Validate booking creation payload.

        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com
        Scope: BookingSerializer.validate (create/update input validation)
        Inputs:
            attrs (dict):
                - member (FamilyMember): resolved from member_id
                - appointment_date (date): required
                - items (list[dict]) | vaccine (Vaccine) | package (VaccinePackage)
        Outputs:
            attrs (dict):
                - Return unchanged attrs if valid
                - No database write (pure validation)
        Raises:
            serializers.ValidationError:
                - {"appointment_date": "..."}: ngày hẹn không hợp lệ
                - {"member_id": "..."}: member không thuộc user hiện tại
                - {"items": "..."}: không chọn vaccine / format items sai
                - {"vaccine_id": "..."}: vượt số liều cho phép
                - {"detail": "..."}: trùng lịch hẹn
        Business Rules:
            1) Appointment Date:
                - Bắt buộc phải có appointment_date
                - appointment_date phải >= hôm nay (timezone.localdate)

            2) Ownership / Security:
                - member phải thuộc acting_user
                (staff đặt thay → context["acting_user"], khách tự đặt → request.user)

            3) Selection:
                - Bắt buộc chọn ít nhất một trong:
                items OR vaccine OR package

            4) Duplicate Booking (same day):
                - Chỉ xét booking còn hiệu lực: pending, confirmed
                - Chặn đặt trùng lịch cùng member + cùng ngày
                - Conflict được xác định theo:
                    a) Trùng vaccine (direct match)
                    b) Trùng disease/phác đồ (regimen-level match)
                WHY:
                    Tránh đặt 2 mũi cùng loại hoặc cùng phác đồ trong cùng một ngày,
                    đảm bảo lịch tiêm nhất quán và đúng nghiệp vụ y tế.

            5) Dose Limits (doses_required):
                - Tổng số mũi đã tiêm + số mũi đang đặt
                không được vượt quá doses_required
                - Áp dụng theo disease (nếu có) hoặc theo vaccine

            6) Regimen Interval (interval_days):
                - Không cho phép đặt lịch sớm hơn khoảng cách quy định
                giữa các mũi trong cùng phác đồ
                - appointment_date >= last_vaccination_date + interval_days

        Notes:
            - Hàm này chỉ validate dữ liệu, KHÔNG ghi DB.
            - Logic phức tạp; nếu mở rộng thêm rule nên tách thành các hàm _validate_* riêng.
        """
        acting_user = self._acting_user()
        member = attrs["member"]
        if not attrs.get("appointment_date"):
            raise serializers.ValidationError(
                {"appointment_date": "Vui lòng chọn ngày hẹn tiêm."}
            )
        appt_date = attrs.get("appointment_date")
        today = timezone.localdate()
        if appt_date < today:
            raise serializers.ValidationError(
                {"appointment_date": "Ngày hẹn phải từ hôm nay trở đi."}
            )
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
        ACTIVE_STATUSES = ("pending", "confirmed")

        want_vaccine_ids = set()
        if items:
            want_vaccine_ids |= {it["vaccine_id"] for it in items}
        if vaccine:
            want_vaccine_ids.add(vaccine.id)

        want_vaccines = Vaccine.objects.filter(id__in=want_vaccine_ids).select_related("disease")
        want_disease_ids = {v.disease_id for v in want_vaccines if v.disease_id}
        dup_booking_qs = Booking.objects.filter(
            member=member,
            appointment_date=appt_date,
            status__in=ACTIVE_STATUSES,
        )
        dup_by_vaccine = dup_booking_qs.filter(
            Q(items__vaccine_id__in=want_vaccine_ids) |
            Q(vaccine_id__in=want_vaccine_ids)
        ).exists()
        # trùng disease 
        dup_by_disease = False
        if want_disease_ids:
            dup_by_disease = dup_booking_qs.filter(
                Q(items__vaccine__disease_id__in=want_disease_ids) |
                Q(vaccine__disease_id__in=want_disease_ids)
            ).exists()

        conflict = dup_booking_qs.filter( Q(items__vaccine_id__in=want_vaccine_ids) | Q(vaccine_id__in=want_vaccine_ids)
        ).select_related("vaccine").prefetch_related("items__vaccine").first()

        if conflict:
            conflict_date = conflict.appointment_date.strftime("%d/%m/%Y")
            names = set()
            if conflict.vaccine:
                names.add(conflict.vaccine.name)
            for it in conflict.items.all():
                if it.vaccine:
                    names.add(it.vaccine.name)

            vaccine_text = ", ".join(sorted(names)) if names else "Không xác định"
            status_text = self.get_status_label(conflict)  
            raise serializers.ValidationError({
                "detail": (
                    f"Vắc xin/phác đồ ({vaccine_text}) đã có lịch hẹn vào ngày "
                    f"{conflict_date} ({status_text}). "
                    f"Vui lòng kiểm tra Sổ tiêm hoặc chọn ngày khác."
                )
            })

        # ===== Validate items (nhiều vaccine) =====
        if items:
            from collections import defaultdict
            want = defaultdict(int)
            seen = set()
            for it in items:
                v_id = it["vaccine_id"]
                if v_id in seen:
                    raise serializers.ValidationError({ "items": "Mỗi vắc xin chỉ được chọn 1 lần trong một lịch hẹn." })
                seen.add(v_id)
                
                if it["quantity"] != 1:
                    raise serializers.ValidationError({ "items": "Mỗi lần đặt lịch chỉ được chọn tối đa 1 liều cho mỗi vắc xin."})
                want[it["vaccine_id"]] += it["quantity"]

            for v_id, qty in want.items():
                v = Vaccine.objects.filter(id=v_id).select_related("disease").first()
                if not v:
                    raise serializers.ValidationError({"items": f"Vắc xin id={v_id} không tồn tại"})
                disease = getattr(v, "disease", None)
                total = ( getattr(disease, "doses_required", None) or getattr(v, "doses_required", None)  or 1)
                if disease:
                    used = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccination_date__isnull=False
                    ).filter( Q(disease=disease) | Q(vaccine__disease=disease) ).count()
                else:
                    used = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccine=v,          
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
            total = ( getattr(disease, "doses_required", None) or getattr(vaccine, "doses_required", None) or 1)
            if disease:
                used = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccination_date__isnull=False
                ).filter( Q(disease=disease) | Q(vaccine__disease=disease)).count()
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
        
        # --- interval_days (phác đồ - không đặt quá sớm)  ---
        if appt_date:
            for it in items:
                v_id = it["vaccine_id"]
                v = Vaccine.objects.filter(id=v_id).select_related("disease").first()
                if not v:
                    continue
                disease = getattr(v, "disease", None)
                interval = (  getattr(disease, "interval_days", None) or getattr(v, "interval_days", None) )
                if not interval:
                    continue
                taken_qs = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccination_date__isnull=False,
                )
                if disease:
                    taken_qs = taken_qs.filter( Q(disease=disease) | Q(vaccine__disease=disease) )
                else:
                    taken_qs = taken_qs.filter(vaccine=v)
                last_rec = taken_qs.order_by("-vaccination_date").first()
                if not last_rec or not last_rec.vaccination_date:
                    continue
                earliest_date = last_rec.vaccination_date + timedelta(days=int(interval))
                if appt_date < earliest_date:
                    raise serializers.ValidationError({
                        "appointment_date": (
                            f"Vắc xin {v.name}: mũi tiếp theo chỉ được tiêm từ "
                            f"{earliest_date.strftime('%d/%m/%Y')} "
                            f"(theo phác đồ cách {interval} ngày)."
                        )
                    })
            #  đặt 1 vaccine đơn        
            if vaccine:
                disease = getattr(vaccine, "disease", None)
                interval = ( getattr(disease, "interval_days", None) or getattr(vaccine, "interval_days", None) )
                if interval:
                    taken_qs = VaccinationRecord.objects.filter(
                        family_member=member,
                        vaccination_date__isnull=False,
                    )
                    if disease:
                        taken_qs = taken_qs.filter( Q(disease=disease) | Q(vaccine__disease=disease))
                    else:
                        taken_qs = taken_qs.filter(vaccine=vaccine)
                    last_rec = taken_qs.order_by("-vaccination_date").first()
                    if last_rec and last_rec.vaccination_date:
                        earliest_date = last_rec.vaccination_date + timedelta(days=int(interval))
                        if appt_date < earliest_date:
                            raise serializers.ValidationError({
                                "appointment_date": (
                                    f"Vắc xin {vaccine.name}: mũi tiếp theo chỉ được tiêm từ "
                                    f"{earliest_date.strftime('%d/%m/%Y')} "
                                    f"(theo phác đồ cách {interval} ngày)."
                                )
                            })
        return attrs

    def create(self, validated_data):
        """
        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com

        Purpose:
            Tạo booking và đồng bộ BookingItem + VaccinationRecord.
        Flow:
            - Create Booking
            - CASE 1: items_data => tạo nhiều BookingItem + upsert VaccinationRecord theo từng vaccine
            - CASE 2: vaccine đơn => tạo 1 BookingItem + upsert VaccinationRecord
            - CASE 3: package => tạo BookingItem cho mỗi vaccine trong package
        Notes:
            - Ưu tiên update mũi trễ (overdue) trước khi tạo mới để tránh trùng planned dose.
            - Gắn source_booking để khóa record và phục vụ status_label/complete logic.
        """
        acting_user = self._acting_user()
        items_data = validated_data.pop("items", [])
        vaccine = validated_data.pop("vaccine", None)
        package = validated_data.pop("package", None)

        booking = Booking.objects.create(user=acting_user, vaccine=vaccine, package=package, **validated_data)
        today = timezone.localdate()
        # ===== CASE 1: có items  =====
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
                name_cond = Q(vaccine_name__iexact=v.name) | Q(vaccine_name__icontains=v.name)
                if v.disease_id:
                    name_cond |= Q(vaccine_name__icontains=v.disease.name)
                overdue_qs = (
                    VaccinationRecord.objects
                    .filter(
                        family_member=booking.member,
                        vaccination_date__isnull=True,
                        next_dose_date__lte=today,
                    ) .filter(
                        Q(disease=v.disease) | Q(vaccine=v)
                        | ( Q(vaccine__isnull=True) & Q(disease__isnull=True) & name_cond)
                    ).order_by("next_dose_date")
                )
                if overdue_qs.exists():
                    target = overdue_qs.first()
                    target.next_dose_date = booking.appointment_date
                    target.note = f"Đặt lại lịch #{booking.id}"
                    update_fields = ["next_dose_date", "note"]
                    if target.source_booking_id != booking.id:
                        target.source_booking = booking
                        update_fields.append("source_booking")
                    if not target.dose_number:
                        target.dose_number = self._get_next_dose_number(booking.member, v)
                        update_fields.append("dose_number")
                    if not target.disease_id and v.disease_id:
                        target.disease = v.disease
                        update_fields.append("disease")
                    if not target.vaccine_id:
                        target.vaccine = v
                        update_fields.append("vaccine")
                    target.save(update_fields=update_fields)
                    overdue_qs.exclude(id=target.id).update(next_dose_date=None, note="", source_booking=None)

                else:
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
            name_cond = Q(vaccine_name__iexact=vaccine.name) | Q(vaccine_name__icontains=vaccine.name)
            if vaccine.disease_id:
                name_cond |= Q(vaccine_name__icontains=vaccine.disease.name)

            overdue_qs = (
                VaccinationRecord.objects
                .filter(
                    family_member=booking.member,
                    vaccination_date__isnull=True,
                    next_dose_date__lte=today,
                ) .filter(
                    Q(disease=vaccine.disease) | Q(vaccine=vaccine)
                    | ( Q(vaccine__isnull=True) & Q(disease__isnull=True) & name_cond)
                ).order_by("next_dose_date")
            )
            if overdue_qs.exists():
                target = overdue_qs.first()
                target.next_dose_date = booking.appointment_date
                target.note = f"Đặt lại lịch #{booking.id}"
                update_fields = ["next_dose_date", "note"]
                if target.source_booking_id != booking.id:
                    target.source_booking = booking
                    update_fields.append("source_booking")
                if not target.dose_number:
                    target.dose_number = self._get_next_dose_number(booking.member, vaccine)
                    update_fields.append("dose_number")
                if not target.disease_id and vaccine.disease_id:
                    target.disease = vaccine.disease
                    update_fields.append("disease")
                if not target.vaccine_id:
                    target.vaccine = vaccine
                    update_fields.append("vaccine")
                target.save(update_fields=update_fields)
                overdue_qs.exclude(id=target.id).update(next_dose_date=None, note="", source_booking=None)
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
        if package:
            # giả sử package có relation: package.vaccines.all()
            for v in package.vaccines.all():
                BookingItem.objects.create(
                    booking=booking, vaccine=v, quantity=1, unit_price=v.price or 0
                )
            return booking
            
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

class AppointmentCreateInSerializer(serializers.Serializer):
    date = serializers.DateTimeField()  
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
    location = serializers.CharField(required=False, allow_blank=True, default="") 
    dose = serializers.CharField(required=False, allow_blank=True)
    batch = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    disease_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, attrs):
        if not attrs.get("location") and attrs.get("place"):
            attrs["location"] = attrs["place"]
        return attrs
    
    def validate_disease_id(self, value):
        if value is None:
            return None
        from vaccines.models import Disease
        d = Disease.objects.filter(id=value).first()
        if not d:
            raise serializers.ValidationError("Phòng bệnh không tồn tại.")
        return d  
    
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
    doses = serializers.ListField( child=serializers.DictField(), allow_empty=True,)

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

        cleaned = []
        for idx, d in enumerate(attrs["doses"], start=1):
            date_str = (d.get("date") or "").strip()
            vaccine_name = (d.get("vaccine") or "").strip()
            place = (d.get("location") or d.get("place") or "").strip()

            if not date_str and not vaccine_name and not place:
                # mũi trống hoàn toàn → bỏ qua
                continue
            if not date_str:
                continue
            try:
                date_val = datetime.fromisoformat(date_str).date()
            except Exception:
                raise serializers.ValidationError({"doses": f"Mũi thứ {idx}: ngày không hợp lệ."})
            
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

