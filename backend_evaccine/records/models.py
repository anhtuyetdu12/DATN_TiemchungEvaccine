from django.db import models
from django.conf import settings
from django.utils import timezone
from vaccines.models import Booking as VaccineBooking
from .models import *

User = settings.AUTH_USER_MODEL

class FamilyMember(models.Model):
    RELATION_CHOICES = [
        ("Bản thân", "Bản thân"),
        ("Vợ", "Vợ"), ("Chồng", "Chồng"),
        ("Con trai", "Con trai"), ("Con gái", "Con gái"),
        ("Bố", "Bố"), ("Mẹ", "Mẹ"),
        ("Ông nội", "Ông nội"), ("Bà nội", "Bà nội"),
        ("Ông ngoại", "Ông ngoại"), ("Bà ngoại", "Bà ngoại"),
        ("Bạn bè", "Bạn bè"), ("Khác", "Khác"),
    ]

    GENDER_CHOICES = [
        ("male", "Nam"),
        ("female", "Nữ"),
        ("other", "Khác"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="family_members", verbose_name="Người dùng")
    full_name = models.CharField(max_length=255, verbose_name="Họ và tên")
    nickname = models.CharField(max_length=255, blank=True, null=True, verbose_name="Tên gọi")
    relation = models.CharField(max_length=50, choices=RELATION_CHOICES, default="Khác", verbose_name="Mối quan hệ")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="other", verbose_name="Giới tính")
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="Ngày sinh")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Số điện thoại")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    is_self = models.BooleanField(default=False, verbose_name="Là bản thân")

    class Meta:
        verbose_name = "Thành viên gia đình"
        verbose_name_plural = "Danh sách thành viên gia đình"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.relation})"



class VaccinationRecord(models.Model):
    family_member = models.ForeignKey(
        FamilyMember, on_delete=models.CASCADE, related_name="vaccinations", null=True, blank=True,
        verbose_name="Thành viên"
    )
    disease = models.ForeignKey('vaccines.Disease', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Bệnh")
    vaccine = models.ForeignKey('vaccines.Vaccine', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Vắc xin")
    dose_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="Mũi số")
    vaccine_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Tên vắc xin (tự nhập)")
    vaccine_lot = models.CharField(max_length=100, blank=True, null=True, verbose_name="Lô vắc xin")
    vaccination_date = models.DateField(null=True, blank=True, verbose_name="Ngày tiêm")
    next_dose_date = models.DateField(blank=True, null=True, verbose_name="Ngày hẹn mũi tiếp theo")
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú")

    class Meta:
        verbose_name = "Mũi tiêm"
        verbose_name_plural = "Lịch sử tiêm chủng"
        ordering = ["-vaccination_date", "-id"]

    def __str__(self):
        member = self.family_member.full_name if self.family_member else "N/A"
        return f"{self.vaccine_name or (self.vaccine.name if self.vaccine else 'Vaccine?')} - {member}"


class BookingProxy(VaccineBooking):
    class Meta:
        proxy = True
        verbose_name = "Lịch hẹn tiêm (Booking)"
        verbose_name_plural = "Danh sách lịch hẹn tiêm "
