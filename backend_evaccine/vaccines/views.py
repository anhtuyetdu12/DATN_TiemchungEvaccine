# vaccines/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, IntegerField, F, Case, When, Value, Q, OuterRef, Subquery, Count
from django.db.models.functions import Coalesce
from rest_framework.decorators import action
from django.http import HttpResponse
from io import BytesIO
from openpyxl import Workbook
from inventory.models import VaccineStockLot
from datetime import date
from .models import Disease, VaccineCategory, Vaccine, VaccinePackage, VaccinePackageGroup
from .serializers import (
    DiseaseSerializer, VaccineCategorySerializer,
    VaccineSerializer, VaccinePackageSerializer, VaccinePackageGroupSerializer
)
from records.models import FamilyMember, VaccinationRecord
from records.serializers import BookingSerializer  
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from records.views import create_planned_records_for_booking


class DiseaseViewSet(viewsets.ModelViewSet):
    """
    DiseaseViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Quản lý API CRUD cho Disease.

    Business Meaning:
        Cho phép FE / Admin quản lý danh sách bệnh
        và phác đồ tiêm tương ứng.

    Notes:
        - Không phân trang
        - AllowAny do dữ liệu bệnh mang tính public
    """

    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [AllowAny]
    pagination_class = None 
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class VaccineCategoryViewSet(viewsets.ModelViewSet):
    """
    VaccineCategoryViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Quản lý API danh mục vắc xin.

    Business Meaning:
        Phân loại vắc xin để phục vụ hiển thị trên FE.

    Notes:
        - AllowAny
    """
    queryset = VaccineCategory.objects.all()
    serializer_class = VaccineCategorySerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class VaccineViewSet(viewsets.ModelViewSet):
    """
    VaccineViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Quản lý API liên quan đến vắc xin.

    Business Meaning:
        Cung cấp các chức năng:
            - danh sách vắc xin
            - gợi ý vắc xin theo tuổi và phác đồ
            - đặt lịch tiêm
            - xuất dữ liệu vắc xin

    Notes:
        - lookup bằng slug
        - một số action yêu cầu đăng nhập
        - dữ liệu by_age phụ thuộc VaccinationRecord
    """
    queryset = Vaccine.objects.all().select_related("disease", "category").order_by("-created_at")
    serializer_class = VaccineSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 
    filterset_fields = ["id", "slug", "status", "disease", "category"]

    lookup_field = "slug"
    lookup_value_regex = r"[-\w]+"

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    @action(detail=False, methods=["get"], url_path="by-ids")
    def by_ids(self, request):
        ids = request.query_params.get("ids", "")
        try:
            id_list = [int(x) for x in ids.split(",") if x.isdigit()]
        except:
            return Response({"error": "ids không hợp lệ"}, status=400)
        qs = self.get_queryset().filter(id__in=id_list)
        return Response(self.get_serializer(qs, many=True).data)

    
    @action(detail=False, methods=["get"], url_path="by-diseases")
    def by_diseases(self, request):
        """ Lấy vắc xin theo danh sách bệnh  """
        disease_ids = request.query_params.get("disease_ids")
        if not disease_ids:
            return Response({"error": "Thiếu disease_ids"}, status=400)
        ids = [int(i) for i in disease_ids.split(",") if i.isdigit()]
        queryset = Vaccine.objects.filter(disease_id__in=ids).select_related("disease", "category")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="by-age", permission_classes=[IsAuthenticated])
    def by_age(self, request):
        """
        Gợi ý vắc xin phù hợp theo tuổi thành viên + thống kê mũi đã tiêm + mũi kế tiếp

        Author: Du Thi Anh Tuyet
        Email: anhtuyetdu21@gmail.com

        Purpose:
            Gợi ý danh sách vắc xin phù hợp cho một thành viên
            dựa trên độ tuổi và lịch sử tiêm chủng.

        Business Rules:
            - Tính tuổi theo tháng từ date_of_birth
            - Chỉ lấy vaccine đang active
            - Lọc theo khoảng tuổi áp dụng của vaccine
            - Thống kê số mũi đã tiêm theo từng bệnh
            - Xác định mũi tiêm kế tiếp theo phác đồ bệnh

        Notes:
            - Dữ liệu doses_used và next_dose_number được tính bằng annotate
            - Phụ thuộc VaccinationRecord
            - Không ghi dữ liệu, chỉ đọc
        """
        member_id = request.query_params.get("member_id")
        disease_id = request.query_params.get("disease_id")
        dose_number = request.query_params.get("dose_number")

        if not member_id:
            return Response({"error": "Thiếu member_id"}, status=400)

        member = FamilyMember.objects.filter(id=member_id).first()
        if not member:
            return Response({"error": "Thành viên không tồn tại"}, status=404)
        user = request.user
        role = getattr(user, "role", "")
        if member.user != user and role not in ("staff", "admin", "superadmin"):
            return Response({"error": "Thành viên không thuộc tài khoản này"}, status=403)
        if not member.date_of_birth:
            return Response({"error": "Thiếu ngày sinh của thành viên"}, status=400)

        today = date.today()
        years = today.year - member.date_of_birth.year - (
            (today.month, today.day) < (member.date_of_birth.month, member.date_of_birth.day)
        )
        month_delta = today.month - member.date_of_birth.month
        if today.day < member.date_of_birth.day:
            month_delta -= 1
        age_months = max(0, min(years * 12 + month_delta, 110 * 12))

        if age_months < 12:
            age_text = f"{age_months} tháng"
        else:
            y = age_months // 12
            m = age_months % 12
            if m == 0:
                age_text = f"{y} tuổi"
            else:
                age_text = f"{y} tuổi {m} tháng"

        qs = Vaccine.objects.filter(status="active").select_related("disease", "category")
        if disease_id and str(disease_id).isdigit():
            qs = qs.filter(disease_id=int(disease_id))

        qs = qs.annotate(
            min_months=Case(
                When(age_unit="tháng", then=F("min_age")),
                When(age_unit="tuổi", then=F("min_age") * 12),
                default=Value(0),
                output_field=IntegerField(),
            ),
            max_months=Case(
                When(age_unit="tháng", then=F("max_age")),
                When(age_unit="tuổi", then=F("max_age") * 12),
                default=Value(None),
                output_field=IntegerField(),
            ),
        ).filter(
            Q(min_months__lte=age_months)
            & (Q(max_months__gte=age_months) | Q(max_months__isnull=True))
        )

        dose_subquery = (
            VaccinationRecord.objects
            .filter(
                family_member=member,
                vaccination_date__isnull=False,
            )
            .filter(
                Q(disease_id=OuterRef("disease_id")) |
                Q(vaccine__disease_id=OuterRef("disease_id"))
            )
            .values("disease_id")
            .order_by()
            .annotate(c=Count("id"))
            .values("c")[:1]
        )
        qs = qs.annotate(
            doses_used=Coalesce(Subquery(dose_subquery), Value(0), output_field=IntegerField()),
            disease_doses_required=F("disease__doses_required"),   
            disease_interval_days=F("disease__interval_days"),
        )
        qs = qs.annotate(
            next_dose_number=Case(
                When(disease_doses_required__isnull=True, then=Value(1)),
                default=F("doses_used") + 1,
                output_field=IntegerField(),
            ) 
        )
        if dose_number and str(dose_number).isdigit():
            qs = qs.filter(next_dose_number=int(dose_number))

        serializer = self.get_serializer(qs, many=True)
        return Response(
            {
                "member": member.full_name,
                "age_text": age_text,
                "age_months": age_months,
                "vaccines": serializer.data,
            }
        )

    @action(detail=True, methods=["post"], url_path="book", permission_classes=[IsAuthenticated])
    def book(self, request, slug=None):
        """ Đặt lịch tiêm 1 vắc xin  """
        vaccine = self.get_object()
        member_id = request.data.get("member_id")
        appointment_date = request.data.get("appointment_date")
        location = request.data.get("location") or ""
        notes = request.data.get("notes") or ""

        if not member_id or not appointment_date:
            return Response({"detail": "Thiếu member_id hoặc appointment_date"}, status=400)

        payload = {
            "member_id": member_id,
            "appointment_date": appointment_date,
            "location": location,
            "notes": notes,
            "vaccine_id": vaccine.id,  
        }
        ser = BookingSerializer(data=payload, context={"request": request})
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        create_planned_records_for_booking(booking)
        return Response(BookingSerializer(booking, context={"request": request}).data, status=201)

    
    @action(detail=False, methods=["post"], url_path="checkout", permission_classes=[IsAuthenticated])
    def checkout(self, request):
        """ Đặt lịch nhiều vắc xin cùng lúc (đặt từ giỏ/checkout)  """
        member_id = request.data.get("member_id")
        appointment_date = request.data.get("appointment_date")
        vaccine_ids = request.data.get("vaccine_ids") or []  # [1,2,3]
        location = request.data.get("location") or ""
        notes = request.data.get("notes") or ""

        if not member_id or not appointment_date or not vaccine_ids:
            return Response({"detail": "Thiếu member_id / appointment_date / vaccine_ids"}, status=400)

        items = [{"vaccine_id": vid, "quantity": 1} for vid in vaccine_ids]

        ser = BookingSerializer(
            data={
                "member_id": member_id,
                "appointment_date": appointment_date,
                "location": location,
                "notes": notes,
                "items": items,
            },
            context={"request": request},
        )
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        create_planned_records_for_booking(booking)
        return Response(BookingSerializer(booking, context={"request": request}).data, status=201)

    
    @action(detail=False, methods=["get"], url_path="export/excel", permission_classes=[IsAuthenticated])
    def export_excel(self, request):
        """  Xuất danh sách vắc xin ra file Excel  """
        search = request.query_params.get("search", "").strip()

        qs = self.get_queryset()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(manufacturer__icontains=search)
                | Q(origin__icontains=search)
                | Q(disease__name__icontains=search)
            )
        wb = Workbook()
        ws = wb.active
        ws.title = "Vaccines"
        ws.append([
            "Tên vắc xin",
            "Phòng bệnh",
            "Mã",
            "Số lượng khả dụng",
            "Đơn vị",
            "Hạn gần nhất",
            "Nhà sản xuất",
            "Quốc gia",
            "Số lô ",
            "Giá (VNĐ)",
            "Ghi chú",
        ])
        for v in qs:
            lots = VaccineStockLot.objects.filter(vaccine=v, is_active=True)

            available = sum(l.quantity_available or 0 for l in lots)
            soonest_expiry = None
            first_lot = None
            for l in lots:
                if l.expiry_date:
                    if soonest_expiry is None or l.expiry_date < soonest_expiry:
                        soonest_expiry = l.expiry_date
                        first_lot = l

            ws.append([
                v.name,
                v.disease.name if v.disease else "",
                v.slug or v.id,
                available,
                v.unit or "liều",
                soonest_expiry.strftime("%d/%m/%Y") if soonest_expiry else "",
                v.manufacturer or "",
                v.origin or "",
                first_lot.lot_number if first_lot else "",
                int(v.price or 0),
                v.other_notes or "",
            ])

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        resp = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp["Content-Disposition"] = 'attachment; filename="vaccines.xlsx"'
        return resp



class VaccinePackageGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    VaccinePackageGroupViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        API đọc danh sách nhóm gói tiêm.

    Business Meaning:
        FE dùng để hiển thị các nhóm gói tiêm theo section.

    Notes:
        - ReadOnly
        - Chỉ lấy group và package đang active
    """
    queryset = VaccinePackageGroup.objects.filter(status=True).prefetch_related(
        Prefetch( "packages",
            queryset=VaccinePackage.objects.filter(status=True).prefetch_related("disease_groups__vaccines")
        )
    ).order_by("-created_at")
    serializer_class = VaccinePackageGroupSerializer
    permission_classes = [AllowAny]


class VaccinePackageViewSet(viewsets.ModelViewSet):
    """
    VaccinePackageViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Quản lý API gói tiêm chủng.

    Business Meaning:
        Cho phép tạo, cập nhật và hiển thị chi tiết gói tiêm.

    Notes:
        - lookup bằng slug
        - yêu cầu đăng nhập cho thao tác ghi
    """
    queryset = VaccinePackage.objects.all().order_by("-created_at")
    serializer_class = VaccinePackageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    lookup_value_regex = r"[-\w]+"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
