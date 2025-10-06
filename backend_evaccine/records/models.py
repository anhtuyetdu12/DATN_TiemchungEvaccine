# records/models.py
from django.db import models
from django.conf import settings
from vaccines.models import Vaccine
User = settings.AUTH_USER_MODEL

class FamilyMember(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="family_members")
    full_name = models.CharField(max_length=200)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=16, choices=(("male","Nam"),("female","Nữ"),("other","Khác")), default="other")
    relation = models.CharField(max_length=64, blank=True)  # e.g. "Con", "Vợ"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.owner})"

class Disease(models.Model):
    name = models.CharField(max_length=200)
    dose_count = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)

    def __str__(self): return self.name

class Vaccine(models.Model):
    name = models.CharField(max_length=200)
    manufacturer = models.CharField(max_length=200, blank=True)
    disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)

    def __str__(self): return self.name

class VaccinationRecord(models.Model):
    SOURCE_CHOICES = (("self","self"),("facility","facility"),("imported","imported"))
    member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name="vaccinations")
    disease = models.ForeignKey(Disease, on_delete=models.PROTECT)
    dose_number = models.PositiveSmallIntegerField()
    date = models.DateField(null=True, blank=True)
    vaccine = models.ForeignKey(Vaccine, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.CharField(max_length=300, blank=True)
    note = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="self")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["member", "disease", "dose_number"], name="unique_member_disease_dose")
        ]

# records/models.py (tiếp)
class Appointment(models.Model):
    STATUS = (
        ("scheduled","Chờ tiêm"),
        ("done","Đã tiêm"),
        ("missed","Trễ hẹn"),
        ("cancelled","Hủy"),
    )
    member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name="appointments")
    disease = models.ForeignKey(Disease, on_delete=models.PROTECT)
    dose_number = models.PositiveSmallIntegerField()
    scheduled_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS, default="scheduled")
    staff = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)  # nếu staff tạo
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
