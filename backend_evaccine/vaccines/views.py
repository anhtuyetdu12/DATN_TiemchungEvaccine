from rest_framework import viewsets, permissions, status
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, Booking, VaccinePackageGroup
from .serializers import (
    DiseaseSerializer, VaccineCategorySerializer,
    VaccineSerializer, VaccinePackageSerializer, BookingSerializer , VaccinePackageGroupSerializer
)
from django.db.models import Prefetch
from rest_framework.decorators import action
from rest_framework.response import Response
from records.models import FamilyMember
from datetime import date
from rest_framework.permissions import IsAuthenticated
from django.db.models import IntegerField, F, Case, When, Value, Q

class DiseaseViewSet(viewsets.ModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class VaccineCategoryViewSet(viewsets.ModelViewSet):
    queryset = VaccineCategory.objects.all()
    serializer_class = VaccineCategorySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all().select_related("disease", "category").order_by('-created_at')
    serializer_class = VaccineSerializer
    permission_classes = [permissions.AllowAny]
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

    # 👉 API: /api/vaccines/by-diseases/?disease_ids=1,2&age_group=6 tháng
    @action(detail=False, methods=["get"], url_path="by-diseases")
    def by_diseases(self, request):
        disease_ids = request.query_params.get("disease_ids")
        if not disease_ids:
            return Response({"error": "Thiếu disease_ids"}, status=400)
        ids = [int(i) for i in disease_ids.split(",") if i.isdigit()]
        queryset = Vaccine.objects.filter(disease_id__in=ids).select_related("disease", "category")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="by-age", permission_classes=[IsAuthenticated])
    def by_age(self, request):
        member_id = request.query_params.get("member_id")
        disease_id = request.query_params.get("disease_id")
        dose_number = request.query_params.get("dose_number")  # mũi N đang xem (optional)

        if not member_id:
            return Response({"error": "Thiếu member_id"}, status=400)

        member = FamilyMember.objects.filter(id=member_id).first()
        if not member: return Response({"error": "Thành viên không tồn tại"}, status=404)
        if member.user != request.user: return Response({"error": "Thành viên không thuộc tài khoản này"}, status=403)
        if not member.date_of_birth: return Response({"error": "Thiếu ngày sinh của thành viên"}, status=400)

        # tuổi (tháng)
        today = date.today()
        years = today.year - member.date_of_birth.year - (
            (today.month, today.day) < (member.date_of_birth.month, member.date_of_birth.day)
        )
        month_delta = today.month - member.date_of_birth.month
        if today.day < member.date_of_birth.day: month_delta -= 1
        age_months = max(0, min(years * 12 + month_delta, 110 * 12))

        qs = Vaccine.objects.filter(status="active")
        if disease_id and str(disease_id).isdigit():
            qs = qs.filter(disease_id=int(disease_id))

        # Chuẩn hoá ngưỡng tuổi về THÁNG
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
            Q(min_months__lte=age_months) & (Q(max_months__gte=age_months) | Q(max_months__isnull=True))
        ).select_related("disease", "category")

        # (tuỳ chọn) lọc theo mũi: chỉ show các vaccine có phác đồ đáp ứng mũi đang xét
        if dose_number and str(dose_number).isdigit():
            qs = qs.filter(Q(doses_required__isnull=True) | Q(doses_required__gte=int(dose_number)))

        serializer = self.get_serializer(qs, many=True)

        # gợi ý "tiếp theo" dựa trên lịch sử các mũi (nếu muốn chặt chẽ hơn)
        # bạn có thể bổ sung một block tính số mũi đã tiêm cho disease_id này để sắp xếp ưu tiên:
        # next_due_dose = (đếm mũi đã tiêm + 1)

        return Response({
            "member": member.full_name,
            "age_text": f"{years} tuổi" if years >= 1 else f"{age_months} tháng",
            "age_months": age_months,
            "vaccines": serializer.data,
        })
        
    
class VaccinePackageGroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VaccinePackageGroup.objects.filter(status=True).prefetch_related(
        Prefetch("packages", queryset=VaccinePackage.objects.prefetch_related("disease_groups__vaccines"))
    ).order_by('-created_at')
    serializer_class = VaccinePackageGroupSerializer
    permission_classes = [permissions.AllowAny]
    
class VaccinePackageViewSet(viewsets.ModelViewSet):
    queryset = VaccinePackage.objects.all().order_by('-created_at')
    serializer_class = VaccinePackageSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    lookup_value_regex = r"[-\w]+"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


        
class BookingViewSet(viewsets.ModelViewSet):
    queryset = (Booking.objects .all() .select_related("user", "member", "vaccine", "package") .prefetch_related("items__vaccine") .order_by('-created_at'))
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=["post"])
    def mark_completed(self, request, pk=None):
        b = self.get_queryset().get(pk=pk)
        VaccinationRecord.objects.filter(
            family_member=b.member, note__icontains=f"Đặt lịch #{b.id}", vaccination_date__isnull=True
        ).update(vaccination_date=b.appointment_date)
        b.status = "completed"
        b.save()
        return Response({"ok": True})

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()  # user đã set trong serializer.create()
