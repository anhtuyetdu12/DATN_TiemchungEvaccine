from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import FamilyMember, Appointment, VaccinationRecord
from .serializers import FamilyMemberSerializer, AppointmentSerializer, VaccinationRecordSerializer
from django.utils.timezone import now
# --- Quản lý thành viên gia đình ---
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import FamilyMember
from .serializers import FamilyMemberSerializer
from rest_framework.permissions import IsAuthenticated


class FamilyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)

    # def list(self, request, *args, **kwargs):
    #     user = request.user
    #     queryset = self.get_queryset()

    #     # Nếu chưa có sổ -> tự tạo “Bản thân”
    #     if not queryset.exists():
    #         default_member = FamilyMember.objects.create(
    #             user=user,
    #             full_name=getattr(user, "full_name", "") or user.username,
    #             nickname=user.username,
    #             relation="Bản thân",
    #             gender="other",
    #             date_of_birth="2000-01-01",
    #             phone=getattr(user, "phone", ""),
    #             is_self=True,
    #         )
    #         queryset = [default_member]
    #     else:
    #         # Đảm bảo “Bản thân” luôn lên đầu danh sách
    #         queryset = sorted(queryset, key=lambda m: 0 if m.relation == "Bản thân" else 1)

    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)

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
                date_of_birth="2000-01-01",   # bạn có thể lấy ngày sinh thật nếu có
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
    
# --- Quản lý lịch hẹn tiêm ---
class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointment.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def auto_update_status(self, request):
        now = timezone.now()
        updated = Appointment.objects.filter(
            status='pending', appointment_date__lt=now
        ).update(status='cancelled')
        return Response({'updated': updated})

    @action(detail=True, methods=['post'])
    def set_next_appointment(self, request, pk=None):
        appointment = self.get_object()
        date = request.data.get("appointment_date")
        if not date:
            return Response({"error": "Thiếu ngày hẹn tiêm"}, status=status.HTTP_400_BAD_REQUEST)
        appointment.appointment_date = date
        appointment.status = 'pending'
        appointment.save()
        return Response({"message": "Cập nhật lịch tiêm tiếp theo thành công"})


# --- Quản lý sổ tiêm chủng ---
class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.all()  # ✅ Bổ sung dòng này luôn
    serializer_class = VaccinationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        member_id = self.request.query_params.get("member_id")
        queryset = VaccinationRecord.objects.filter(family_member__user=self.request.user)
        if member_id:
            queryset = queryset.filter(family_member_id=member_id)
        return queryset.order_by("-vaccination_date")

    def perform_create(self, serializer):
        serializer.save()
