from rest_framework import viewsets, permissions
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, Booking, VaccinePackageGroup
from .serializers import (
    DiseaseSerializer, VaccineCategorySerializer,
    VaccineSerializer, VaccinePackageSerializer, BookingSerializer , VaccinePackageGroupSerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import VaccineFilter
from django.db.models import Prefetch
from rest_framework.decorators import action
from rest_framework.response import Response

class DiseaseViewSet(viewsets.ModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [permissions.AllowAny]


class VaccineCategoryViewSet(viewsets.ModelViewSet):
    queryset = VaccineCategory.objects.all()
    serializer_class = VaccineCategorySerializer
    permission_classes = [permissions.AllowAny]


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all().select_related("disease", "category").order_by('-created_at')
    serializer_class = VaccineSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        age_group = self.request.query_params.get("age_group")
        if age_group:
            queryset = queryset.filter(age_group__icontains=age_group)
        return queryset
    # 👉 API: /api/vaccines/by-diseases/?disease_ids=1,2&age_group=6 tháng
    @action(detail=False, methods=["get"], url_path="by-diseases")
    def by_diseases(self, request):
        disease_ids = request.query_params.get("disease_ids")
        age_group = request.query_params.get("age_group")

        if not disease_ids:
            return Response({"error": "Thiếu disease_ids"}, status=400)

        ids = [int(i) for i in disease_ids.split(",") if i.isdigit()]
        queryset = Vaccine.objects.filter(disease_id__in=ids)

        if age_group:
            queryset = queryset.filter(age_group__icontains=age_group)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related("user", "vaccine", "package").order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
