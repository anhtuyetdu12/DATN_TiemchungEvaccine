from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from vaccines.models import Vaccine
from datetime import date
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from django.utils.dateparse import parse_date
from inventory.models import VaccineStockLot, BookingAllocation
from users.models import CustomUser 
from .models import FamilyMember, VaccinationRecord, Booking, BookingItem
from .serializers import ( 
    FamilyMemberSerializer, VaccinationRecordSerializer,                      
    CustomerListSerializer, CustomerMemberSlimSerializer,
    AppointmentCreateInSerializer, AppointmentStatusPatchSerializer,
    HistoryCreateInSerializer, StaffBookingCreateInSerializer, BookingSerializer
)

class FamilyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # GÁN user cho bản ghi mới => tránh NULL user_id
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # (tuỳ chọn) đảm bảo không đổi chủ sở hữu
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        user = request.user
        queryset = self.get_queryset()

        # Kiểm tra đã có "Bản thân" chưa
        self_member = queryset.filter(relation="Bản thân").first()
        if not self_member:
            # Tạo default member cho user chính
            self_member = FamilyMember.objects.create(
                user=user,
                full_name=getattr(user, "full_name", "") or user.email,
                nickname=getattr(user, "full_name", "") or user.email,
                relation="Bản thân",
                gender="other",
                date_of_birth=date(2000, 1, 1),
                phone=getattr(user, "phone", ""),
                is_self=True  # nếu model có cột này
            )
            # Đặt queryset gồm member mới + các thành viên khác
            other_members = queryset.exclude(id=self_member.id)
            queryset = [self_member] + list(other_members)
        else:
            # Đảm bảo “Bản thân” luôn lên đầu danh sách
            other_members = queryset.exclude(id=self_member.id)
            queryset = [self_member] + list(other_members)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

# --- Quản lý sổ tiêm chủng ---
class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.all()  
    serializer_class = VaccinationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        member_id = self.request.query_params.get("member_id")
        queryset = VaccinationRecord.objects.filter(
            family_member__user=self.request.user
        ).filter(
            Q(vaccination_date__isnull=False) | Q(next_dose_date__isnull=False)
        )
        if member_id:
            queryset = queryset.filter(family_member_id=member_id)
        return queryset.order_by("-vaccination_date")

    def perform_create(self, serializer):
        serializer.save()

# ---------- đặt hẹn mũi tiêm  -----------
class RemainingDosesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        member_id = request.query_params.get("member_id")
        vaccine_id = request.query_params.get("vaccine_id")
        if not member_id or not vaccine_id:
            return Response({"error": "Thiếu member_id/vaccine_id"}, status=400)
        member = FamilyMember.objects.filter(id=member_id, user=request.user).first()
        vaccine = Vaccine.objects.filter(id=vaccine_id).first()
        if not member or not vaccine:
            return Response({"error": "Không hợp lệ"}, status=400)
        total = vaccine.doses_required or 1
        used = VaccinationRecord.objects.filter(family_member=member, vaccine=vaccine,  vaccination_date__isnull=False).count()
        return Response({"remaining": max(total - used, 0), "total": total, "used": used})
    
# ---------- booking -----------
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related("user", "member").prefetch_related("items__vaccine")
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_superuser and getattr(user, "role", "") != "staff":
            qs = qs.filter(user=user)

        status_param = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if status_param in ("pending", "confirmed", "completed", "cancelled"):
            qs = qs.filter(status=status_param)

        if search:
            qs = qs.filter(
                Q(user__email__icontains=search) |
                Q(member__full_name__icontains=search) |
                Q(location__icontains=search)
            )

        if date_from:
            d1 = parse_date(date_from)
            if d1:
                qs = qs.filter(appointment_date__gte=d1)
        if date_to:
            d2 = parse_date(date_to)
            if d2:
                qs = qs.filter(appointment_date__lte=d2)

        return qs.order_by("-appointment_date", "-created_at")

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ("cancelled", "completed"):
            return Response({"detail": "Không thể xác nhận lịch đã hủy/đã hoàn thành."}, status=400)
        if booking.status == "confirmed":
            return Response({"status": "confirmed"}, status=200)

        try:
            with transaction.atomic():
                # (1) Giữ chỗ + trừ tồn khả dụng theo FIFO hạn dùng
                for item in booking.items.select_related("vaccine").all():
                    need = item.quantity
                    lots = (VaccineStockLot.objects.select_for_update()
                            .filter(
                                vaccine=item.vaccine,
                                is_active=True,
                                expiry_date__gte=timezone.now().date()
                            )
                            .order_by("expiry_date"))
                    for lot in lots:
                        if need <= 0:
                            break
                        take = min(lot.quantity_available, need)
                        if take > 0:
                            lot.quantity_available -= take
                            lot.save(update_fields=["quantity_available"])
                            BookingAllocation.objects.create(
                                booking_item=item, lot=lot, quantity=take, status="reserved"
                            )
                            need -= take
                    if need > 0:
                        raise ValueError(f"Tồn kho không đủ cho {item.vaccine.name}. Thiếu {need} liều.")

                # (2) Đổi allocations sang 'consumed' (đã tiêm)
                # for item in booking.items.all():
                #     item.allocations.filter(status="reserved").update(status="consumed")

                # # (3) Cập nhật sổ tiêm: đánh dấu đã tiêm hôm nay
                # today = timezone.now().date()
                # VaccinationRecord.objects.filter(
                #     family_member=booking.member,
                #     vaccine__in=booking.items.values("vaccine_id"),
                #     next_dose_date=booking.appointment_date,
                #     vaccination_date__isnull=True,
                # ).update(vaccination_date=today, next_dose_date=None)

                # (4) Hoàn tất booking
                booking.status = "confirmed"
                booking.save(update_fields=["status"])
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        return Response({"status": "confirmed"})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status == "completed":
            return Response({"detail":"Không thể hủy lịch đã tiêm."}, status=400)

        with transaction.atomic():
            # 1) Trả hàng từ các allocation đang giữ
            for item in booking.items.all():
                for alloc in item.allocations.select_for_update().filter(status="reserved"):
                    lot = alloc.lot
                    lot.quantity_available += alloc.quantity
                    lot.save(update_fields=["quantity_available"])
                    alloc.status = "released"
                    alloc.save(update_fields=["status"])

            # 2) XÓA next_dose_date của các dòng sổ tiêm “dự kiến” thuộc lịch này
            from records.models import VaccinationRecord
            VaccinationRecord.objects.filter(
                family_member=booking.member,
                vaccination_date__isnull=True,
            ).filter(
                Q(source_booking=booking) | Q(next_dose_date=booking.appointment_date)
            ).update(next_dose_date=None)

        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        return Response({"status":"cancelled"})


    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        booking = self.get_object()
        if booking.status == "cancelled":
            return Response({"detail":"Lịch đã hủy không thể hoàn thành."}, status=400)
        if booking.status == "completed":
            # Cho phép bổ sung note về sau? => PATCH riêng là đẹp hơn.
            return Response({"detail":"Lịch đã hoàn thành."}, status=200)

        reaction_note = (request.data.get("reaction_note") or "").strip()

        with transaction.atomic():
            # đổi allocation -> consumed
            for item in booking.items.all():
                item.allocations.filter(status="reserved").update(status="consumed")

            # cập nhật sổ tiêm
            from records.models import VaccinationRecord
            today = timezone.now().date()

            # Lấy các record dự kiến ứng với lịch này
            rec_qs = VaccinationRecord.objects.select_for_update().filter(
                family_member=booking.member,
                vaccine__in=booking.items.values("vaccine_id"),
                next_dose_date=booking.appointment_date,
                vaccination_date__isnull=True,
            )

            updated = 0
            for rec in rec_qs:
                rec.vaccination_date = today
                rec.next_dose_date = None
                if reaction_note:
                    rec.note = (rec.note + "\n" if rec.note else "") + reaction_note
                rec.save(update_fields=["vaccination_date","next_dose_date","note"])
                updated += 1

            booking.status = "completed"
            booking.save(update_fields=["status"])

        return Response({"status": "completed", "updated_records": updated}, status=200)


# ---------- Trả danh sách “khách hàng”  -----------
class StaffCustomerListAPIView(APIView):
    """
    GET /api/records/staff/customers/?include=members
    Trả đúng shape mà FE đang dùng (CustomerListSerializer)
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        include = request.query_params.get("include", "")
        include_members = "members" in [s.strip() for s in include.split(",") if s]

        qs = CustomUser.objects.filter(role="customer")
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            qs = qs.filter(id=request.user.id)

        data = []
        for u in qs:
            code = f"KH-{u.id:04d}"
            # LẤY MEMBER “BẢN THÂN” CHO USER HIỆN TẠI
            m_self = (
                FamilyMember.objects
                .filter(user=u, relation="Bản thân")
                .order_by("-is_self", "-created_at")
                .first()
            )
            # 5 lịch hẹn gần nhất
            bookings = (
                Booking.objects.filter(user=u)
                .select_related("vaccine", "package")
                .prefetch_related("items__vaccine")
                .order_by("-appointment_date")[:5]
            )
            appts = []
            for b in bookings:
                item_names = []
                total_price = 0
                for it in b.items.all():
                    if it.vaccine:
                        q = int(it.quantity or 0)
                        item_names.append(f"{it.vaccine.name} x{q}")
                        try:
                            total_price += int(float(it.unit_price or 0)) * q
                        except:
                            pass
                vaccine_label = ", ".join(item_names) or (
                    b.vaccine.name if b.vaccine else (f"Gói: {b.package.name}" if b.package else "")
                )
                appts.append({
                    "id": str(b.id),
                    "date": b.appointment_date,
                    "vaccine": vaccine_label,
                    "center": b.location or "",
                    "status": b.status,
                    "price": int(total_price),
                })
            # lịch sử tiêm (tối đa 50)
            recs = (
                VaccinationRecord.objects
                .filter(family_member__user=u)
                .select_related("family_member", "vaccine", "disease")
                .exclude(vaccination_date__isnull=True)
                .order_by("-vaccination_date")[:50]
            )
            history = []
            for r in recs:
                history.append({
                    "id": str(r.id),
                    "date": r.vaccination_date,
                    "member_id": r.family_member_id,
                    "member_name": r.family_member.full_name if r.family_member else "",
                    "relation": r.family_member.relation if r.family_member else "",
                    "disease": r.disease.name if r.disease else "",
                    "vaccine": r.vaccine.name if r.vaccine else (r.vaccine_name or ""),
                    "dose": int(r.dose_number or 1),
                    "price": int(getattr(r.vaccine, "price", 0) or 0),
                    "note": r.note or "",
                    "status_label": "Đã tiêm",
                })
            doses_count = (
                VaccinationRecord.objects
                .filter(family_member__user=u)
                .exclude(vaccination_date__isnull=True)
                .count()
            )
            row = {
                "id": int(u.id),
                "code": code,
                "name": u.full_name or u.email,
                "phone": u.phone or "",
                "email": u.email,
                "dob": m_self.date_of_birth if m_self else None, 
                "gender": (m_self.gender or "") if m_self else "",
                "address": "",
                "country": "Việt Nam",
                "category": "",
                "doses": int(doses_count),
                "appointments": appts,
                "history": history,
            }
            if include_members:
                members = FamilyMember.objects.filter(user=u).order_by("-is_self", "-created_at")
                row["members"] = [
                    {
                        "id": m.id,
                        "full_name": m.full_name,
                        "nickname": m.nickname or "",
                        "relation": m.relation or "",
                        "gender": m.gender or "",
                        "date_of_birth": m.date_of_birth,
                        "phone": getattr(m, "phone", "") or "",
                    } for m in members
                ]
            data.append(row)
        ser = CustomerListSerializer(data, many=True)
        return Response(ser.data, status=200)

# ---------- lấy members của 1 user cụ thể.  -----------
class StaffCustomerMembersAPIView(APIView):
    """
    GET /api/records/staff/customers/<user_id>/members/
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin") and request.user.id != user_id:
            return Response({"detail": "Forbidden"}, status=403)
        members = FamilyMember.objects.filter(user_id=user_id).order_by("-created_at")
        ser = CustomerMemberSlimSerializer(members, many=True)
        return Response(ser.data, status=200)



# ---------- Lịch hẹn tiêm chủng  -----------

class StaffListAppointmentsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin") and request.user.id != user_id:
            return Response({"detail": "Forbidden"}, status=403)

        bookings = (
            Booking.objects.filter(user_id=user_id)
            .select_related("vaccine", "package", "member")
            .prefetch_related("items__vaccine__disease")
            .order_by("-appointment_date")
        )

        # (tuỳ chọn) giữ nguyên lọc theo ?status
        status_q = request.query_params.get("status", "")
        if status_q:
            allowed = {"pending", "confirmed", "completed", "cancelled"}
            want = [s.strip() for s in status_q.split(",") if s.strip() in allowed]
            if want:
                bookings = bookings.filter(status__in=want)

        today = timezone.now().date()
        data = []
        for b in bookings:
            items_summary, disease_names, total_price = [], [], 0
            for it in b.items.all():
                if it.vaccine:
                    q = int(it.quantity or 0)
                    items_summary.append({"name": it.vaccine.name, "qty": q})
                    if it.vaccine.disease:
                        disease_names.append(it.vaccine.disease.name)
                    try:
                        total_price += int(float(it.unit_price or 0)) * q
                    except:
                        pass

            vaccine_label = ", ".join([f"{s['name']} x{s['qty']}" for s in items_summary]) or (
                b.vaccine.name if b.vaccine else (f"Gói: {b.package.name}" if b.package else "")
            )

            # ----- NEW: tính trễ hẹn -----
            is_overdue = (
                b.status not in ("completed", "cancelled")
                and b.appointment_date is not None
                and b.appointment_date < today
            )
            effective_status = "overdue" if is_overdue else b.status

            planned = VaccinationRecord.objects.filter(
                family_member=b.member,
                next_dose_date=b.appointment_date,
            ).order_by("dose_number")
            doses = [p.dose_number for p in planned if p.dose_number is not None]
            dose = doses[0] if len(doses) == 1 else None

            status_label = (
                "Trễ hẹn" if is_overdue else {
                    "pending": "Chờ xác nhận",
                    "confirmed": "Đã xác nhận",
                    "completed": "Đã tiêm xong",
                    "cancelled": "Đã hủy",
                }.get(b.status, b.status)
            )

            data.append({
                "id": str(b.id),
                "date": b.appointment_date,
                "vaccine": vaccine_label,
                "items_summary": items_summary,
                "center": b.location or "",
                "status": b.status, 
                "status_label": status_label,
                "effective_status": effective_status,
                "is_overdue": is_overdue,      
                "price": int(total_price),
                "member_id": b.member_id,
                "member_name": b.member.full_name if b.member else "",
                "relation": b.member.relation if b.member else "",
                "disease": ", ".join(dict.fromkeys(disease_names)) if disease_names else "",
                "dose": dose,
            })
        return Response(data, status=200)


# ---------- cập nhật trạng thái - patch -----------
class StaffUpdateAppointmentStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, user_id: int, appt_id: str):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin") and request.user.id != user_id:
            return Response({"detail": "Forbidden"}, status=403)
        ser = AppointmentStatusPatchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        new_status = ser.validated_data["status"]
        booking = Booking.objects.filter(id=appt_id, user_id=user_id).first()
        if not booking:
            return Response({"detail": "Lịch hẹn không tồn tại"}, status=404)

        if booking.status == "completed" and new_status != "completed":
            return Response({"detail": "Không thể đổi trạng thái lịch đã hoàn thành"}, status=400)

        with transaction.atomic():
            if new_status == "cancelled":
                # trả hàng & gỡ lịch dự kiến, giống BookingViewSet.cancel
                for item in booking.items.all():
                    for alloc in item.allocations.select_for_update().filter(status="reserved"):
                        lot = alloc.lot
                        lot.quantity_available += alloc.quantity
                        lot.save(update_fields=["quantity_available"])
                        alloc.status = "released"
                        alloc.save(update_fields=["status"])

                    VaccinationRecord.objects.filter(
                        family_member=booking.member,
                        vaccination_date__isnull=True,
                    ).filter(
                        Q(source_booking=booking) | Q(next_dose_date=booking.appointment_date)
                    ).update(next_dose_date=None)

            elif new_status == "completed":
                today = timezone.now().date()
                VaccinationRecord.objects.filter(
                    family_member=booking.member,
                    vaccine__in=booking.items.values("vaccine_id"),
                    next_dose_date=booking.appointment_date,
                    vaccination_date__isnull=True,
                ).update(vaccination_date=today, next_dose_date=None)

            booking.status = new_status
            booking.save(update_fields=["status"])
            booking = (
                Booking.objects.select_related("vaccine", "package")
                .prefetch_related("items__vaccine")
                .get(id=booking.id)
            )
            total_price = sum([(int(float(it.unit_price or 0))) * int(it.quantity or 0) for it in booking.items.all()])
            names = [f"{it.vaccine.name} x{int(it.quantity or 0)}" for it in booking.items.all() if it.vaccine]
            vaccine_label = ", ".join(names) or (booking.vaccine.name if booking.vaccine else (f"Gói: {booking.package.name}" if booking.package else ""))
            return Response({
                "id": str(booking.id),
                "date": booking.appointment_date,
                "vaccine": vaccine_label,
                "center": booking.location or "",
                "status": booking.status,
                "price": int(total_price),
            }, status=200)

# ---------- Lịch sử tiêm chủng -----------
class StaffAddHistoryAPIView(APIView):
    """
    POST /api/records/staff/customers/<user_id>/history
    """
    permission_classes = [IsAuthenticated]
    def post(self, request, user_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin") and request.user.id != user_id:
            return Response({"detail": "Forbidden"}, status=403)
        ser = HistoryCreateInSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        user = CustomUser.objects.filter(id=user_id, role="customer").first()
        if not user:
            return Response({"detail": "Customer không tồn tại"}, status=404)
        member = FamilyMember.objects.filter(user=user).order_by("-is_self", "-created_at").first()
        if not member:
            return Response({"detail": "Chưa có hồ sơ thành viên"}, status=400)

        rec = VaccinationRecord.objects.create(
            family_member=member,
            vaccine=None,
            vaccine_name=data["vaccine"],
            vaccine_lot=data.get("batch") or "",
            vaccination_date=data["date"],
            next_dose_date=None,
            note=data.get("note") or "",
        )
        return Response({
            "id": str(rec.id),
            "date": rec.vaccination_date,
            "vaccine": rec.vaccine.name if rec.vaccine else (rec.vaccine_name or ""),
            "batch": rec.vaccine_lot or "",
            "note": rec.note or "",
        }, status=201)
        
# staff cập nhật tt ng dùng
class StaffUpdateCustomerProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=403)

        user = CustomUser.objects.filter(id=user_id, role="customer").first()
        if not user:
            return Response({"detail": "Customer không tồn tại"}, status=404)

        full_name = (request.data.get("full_name") or "").strip()
        phone     = (request.data.get("phone") or "").strip()
        dob       = request.data.get("date_of_birth")  # "YYYY-MM-DD"
        gender    = (request.data.get("gender") or "").strip()  # male|female|other

        if full_name:
            user.full_name = full_name
        if phone:
            user.phone = phone
        user.save(update_fields=["full_name", "phone"])

        m_self = FamilyMember.objects.filter(user=user, relation="Bản thân").first()
        if not m_self:
            m_self = FamilyMember.objects.create(
                user=user,
                full_name=user.full_name or user.email,
                nickname=user.full_name or user.email,
                relation="Bản thân",
                gender="other",
                date_of_birth=date(2000,1,1),
                is_self=True
            )

        if dob:
            m_self.date_of_birth = dob
        if gender in ("male","female","other"):
            m_self.gender = gender
        m_self.full_name = user.full_name or m_self.full_name
        m_self.phone = user.phone or m_self.phone
        m_self.save()

        return Response({
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "phone": user.phone,
            },
            "self_member": {
                "id": m_self.id,
                "date_of_birth": m_self.date_of_birth,
                "gender": m_self.gender,
            }
        }, status=200)
        
#  staff qly thành viên 
class StaffManageMemberAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=403)
        user = CustomUser.objects.filter(id=user_id, role="customer").first()
        if not user:
            return Response({"detail": "Customer không tồn tại"}, status=404)

        payload = request.data or {}
        fm = FamilyMember.objects.create(
            user=user,
            full_name=payload.get("full_name") or payload.get("name") or "",
            nickname=payload.get("nickname") or payload.get("full_name") or "",
            relation=payload.get("relation") or "Khác",
            gender=payload.get("gender") or "other",
            date_of_birth=payload.get("date_of_birth"),
            phone=payload.get("phone") or "",
            is_self=False,
        )
        return Response({
            "id": fm.id,
            "full_name": fm.full_name,
            "relation": fm.relation,
            "gender": fm.gender,
            "date_of_birth": fm.date_of_birth,
            "phone": fm.phone,
        }, status=201)

    def patch(self, request, user_id: int, member_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=403)
        fm = FamilyMember.objects.filter(id=member_id, user_id=user_id).first()
        if not fm:
            return Response({"detail": "Thành viên không tồn tại"}, status=404)
        data = request.data or {}
        for f in ["full_name", "nickname", "relation", "gender", "date_of_birth", "phone"]:
            if f in data and data[f] is not None:
                setattr(fm, f, data[f])
        fm.save()
        return Response({"detail": "Updated"}, status=200)

    def delete(self, request, user_id: int, member_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=403)
        fm = FamilyMember.objects.filter(id=member_id, user_id=user_id).first()
        if not fm:
            return Response({"detail": "Thành viên không tồn tại"}, status=404)
        if getattr(fm, "is_self", False):
            return Response({"detail": "Không thể xoá bản thân"}, status=400)
        fm.delete()
        return Response(status=204)
    
# ---------- Tạo booking  cho n customer  -----------
class StaffCreateAppointmentAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, user_id: int):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=403)

        user = CustomUser.objects.filter(id=user_id, role="customer").first()
        if not user:
            return Response({"detail": "Customer không tồn tại"}, status=404)

        # staff gửi đúng shape (member_id, appointment_date, items)
        in_ser = StaffBookingCreateInSerializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        data = in_ser.validated_data

        # ép owner là customer này
        if data["member"].user_id != user.id:
            return Response({"detail": "Thành viên không thuộc tài khoản này."}, status=400)

        # map sang BookingSerializer để dùng validate() có sẵn
        payload = {
            "member_id": data["member"].id,
            "appointment_date": data["appointment_date"],
            "location": data.get("location") or "",
            "notes": data.get("notes") or "",
            "items": [{"vaccine_id": it["vaccine_id"], "quantity": it["quantity"]} for it in data["items"]],
        }
        ser = BookingSerializer(
            data=payload,
            context={"request": request, "acting_user": user}  # user ở đây là customer đã load ở trên
        )
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        return Response(BookingSerializer(booking, context={"request": request}).data, status=201)
    

