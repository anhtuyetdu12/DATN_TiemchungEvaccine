# inventory/models.py
from django.db import models
from django.utils import timezone
from vaccines.models import Vaccine

class VaccineStockLot(models.Model):
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name="stock_lots", verbose_name="Vắc xin")
    lot_number = models.CharField("Số lô", max_length=100)
    expiry_date = models.DateField("Hạn dùng")
    quantity_total = models.PositiveIntegerField("Tổng số lượng", default=0)
    quantity_available = models.PositiveIntegerField("Số lượng khả dụng", default=0)
    location = models.CharField("Kho/cơ sở", max_length=255, blank=True, null=True)
    is_active = models.BooleanField("Đang sử dụng", default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Lô vắc xin"
        verbose_name_plural = "Danh sách lô vắc xin"
        indexes = [models.Index(fields=["vaccine", "expiry_date", "is_active"])]

    def __str__(self):
        return f"{self.vaccine.name} | {self.lot_number} | {self.expiry_date}"

    @property
    def is_expired(self):
        return self.expiry_date < timezone.now().date()


class BookingAllocation(models.Model):
    booking_item = models.ForeignKey('records.BookingItem', on_delete=models.CASCADE, related_name='allocations')
    lot = models.ForeignKey(VaccineStockLot, on_delete=models.PROTECT, related_name="allocations")
    quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=(("reserved", "Đã giữ chỗ"), ("consumed", "Đã tiêu thụ"), ("released", "Đã trả lại")),
        default="reserved"
    )
    reserved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Phân bổ lịch hẹn"
        verbose_name_plural = "Phân bổ lịch hẹn"
        ordering = ["-reserved_at"]
