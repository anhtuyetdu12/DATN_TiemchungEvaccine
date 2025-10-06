from django.shortcuts import render

# Create your views here.
# records/views.py
from rest_framework import viewsets, permissions
from .models import FamilyMember, Disease, Vaccine, VaccinationRecord, Appointment
from .serializers import FamilyMemberSerializer, DiseaseSerializer, VaccineSerializer, VaccinationRecordSerializer, AppointmentSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class IsOwnerPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "owner", None) == request.user

class FamilyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FamilyMember.objects.filter(owner=self.request.user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [permissions.AllowAny]

class VaccineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vaccine.objects.all()
    serializer_class = VaccineSerializer

class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.all()
    serializer_class = VaccinationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # users only see records for their family members
        return VaccinationRecord.objects.filter(member__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        # validate owner, unique mũi
        return super().create(request, *args, **kwargs)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # owner only
        return Appointment.objects.filter(member__owner=self.request.user)
