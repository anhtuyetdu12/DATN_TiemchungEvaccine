from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import FamilyMember, VaccinationRecord
from .serializers import FamilyMemberSerializer, VaccinationRecordSerializer
from .models import FamilyMember
from .serializers import FamilyMemberSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from vaccines.models import Vaccine
from datetime import date

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
        queryset = VaccinationRecord.objects.filter(family_member__user=self.request.user)
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
        used = VaccinationRecord.objects.filter(family_member=member, vaccine=vaccine).count()
        return Response({"remaining": max(total - used, 0), "total": total, "used": used})
    


