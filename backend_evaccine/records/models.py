from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class FamilyMember(models.Model):
    RELATION_CHOICES = [ ("Bản thân", "Bản thân"),
        ("Vợ", "Vợ"), ("Chồng", "Chồng"), ("Con trai", "Con trai"), ("Con gái", "Con gái"),
        ("Bố", "Bố"), ("Mẹ", "Mẹ"), ("Ông nội", "Ông nội"), ("Bà nội", "Bà nội"),
        ("Ông ngoại", "Ông ngoại"), ("Bà ngoại", "Bà ngoại"), ("Bạn bè", "Bạn bè"), ("Khác", "Khác"),
    ]

    GENDER_CHOICES = [
        ("male", "Nam"),
        ("female", "Nữ"),
        ("other", "Khác"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="family_members")
    full_name = models.CharField(max_length=255)
    nickname = models.CharField(max_length=255, blank=True, null=True)
    relation = models.CharField(max_length=50, choices=RELATION_CHOICES, default="Khác")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="other")
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    is_self = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.full_name} ({self.relation})"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ tiêm'),
        ('confirmed', 'Đã tiêm'),
        ('cancelled', 'Đã hủy'),
        ('completed', 'Hoàn tất'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    member = models.ForeignKey(FamilyMember, null=True, blank=True, on_delete=models.SET_NULL)
    vaccine = models.ForeignKey('vaccines.Vaccine', on_delete=models.CASCADE)
    appointment_date = models.DateTimeField()
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, related_name='handled_appointments', on_delete=models.SET_NULL)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    appointment_type = models.CharField(max_length=20, blank=True, null=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.vaccine.name} ({self.get_status_display()})"


class VaccinationRecord(models.Model):
    family_member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name="vaccinations", null=True, blank=True)
    disease = models.ForeignKey('vaccines.Disease', on_delete=models.CASCADE, null=True, blank=True)
    dose_number = models.PositiveIntegerField(default=1)
    vaccine_name = models.CharField(max_length=255, null=True, blank=True)
    vaccine_lot = models.CharField(max_length=100, blank=True, null=True)
    vaccination_date = models.DateField(null=True, blank=True)
    next_dose_date = models.DateField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.vaccine_name} - {self.family_member.full_name}"
    