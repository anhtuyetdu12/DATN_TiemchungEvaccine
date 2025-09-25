from django.db import models
from patients.models import Patient
from vaccines.models import Vaccine

# Create your models here.
class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Chờ tiêm'),
        ('completed', 'Đã tiêm'),
        ('missed', 'Bỏ lỡ'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE)
    appointment_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Lịch hẹn {self.patient} - {self.vaccine} ({self.appointment_date})"