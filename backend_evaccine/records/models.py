from django.db import models
from django.conf import settings
from django.utils import timezone
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


class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Người đặt")
    member = models.ForeignKey('records.FamilyMember', on_delete=models.CASCADE, verbose_name="Người tiêm")

    # FK vẫn trỏ sang vaccines
    vaccine = models.ForeignKey('vaccines.Vaccine', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Vắc xin")
    package = models.ForeignKey('vaccines.VaccinePackage', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Gói tiêm")

    appointment_date = models.DateField("Ngày hẹn tiêm", blank=True, null=True)
    location = models.CharField("Địa điểm tiêm", max_length=255, blank=True, null=True)
    status = models.CharField(
        "Trạng thái lịch hẹn",
        max_length=20,
        choices=(("pending","Chờ xác nhận"),("confirmed","Đã xác nhận"),("completed","Đã tiêm xong"),("cancelled","Đã hủy")),
        default="pending",
    )
    notes = models.TextField("Ghi chú thêm", blank=True, null=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)

    class Meta:
        db_table = 'vaccines_booking'         # << GIỮ NGUYÊN TÊN BẢNG!
        verbose_name = "Lịch hẹn tiêm"
        verbose_name_plural = "Danh sách lịch hẹn tiêm"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Lịch hẹn của {getattr(self.user, 'full_name', self.user)} - {self.appointment_date}"


class BookingItem(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="items", verbose_name="Đơn đặt hẹn")
    vaccine = models.ForeignKey('vaccines.Vaccine', on_delete=models.CASCADE, verbose_name="Vắc xin")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số liều")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Đơn giá")

    class Meta:
        db_table = 'vaccines_bookingitem'     # << GIỮ NGUYÊN TÊN BẢNG!
        verbose_name = "Mục vắc xin"
        verbose_name_plural = "Danh sách mục vắc xin"