# inventory/models.py
from django.db import models
from django.utils import timezone
from vaccines.models import Vaccine
from django.conf import settings

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


class InventoryAlert(models.Model):
    URGENCY_CHOICES = (("low","Nhẹ"),("normal","Thường"),("high","Khẩn"))
    STATUS_CHOICES = (("new","Mới"),("ack","Đã tiếp nhận"),("done","Đã xử lý"))

    vaccine = models.ForeignKey(Vaccine, on_delete=models.SET_NULL, null=True, related_name="inventory_alerts", verbose_name="Vắc xin")
    title = models.CharField("Tiêu đề", max_length=255)
    message = models.TextField("Nội dung", blank=True, null=True)
    desired_qty = models.PositiveIntegerField("Số lượng mong muốn", blank=True, null=True)
    urgency = models.CharField("Mức độ", max_length=10, choices=URGENCY_CHOICES, default="normal")
    status = models.CharField("Trạng thái", max_length=10, choices=STATUS_CHOICES, default="new")

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Người tạo")
    created_at = models.DateTimeField("Thời điểm tạo", auto_now_add=True)
    acknowledged_at = models.DateTimeField("Tiếp nhận lúc", blank=True, null=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="processed_inventory_alerts", verbose_name="Người xử lý")
    processed_at = models.DateTimeField("Xử lý lúc", blank=True, null=True)

    class Meta:
        verbose_name = "Thông báo tồn kho"
        verbose_name_plural = "Thông báo tồn kho"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.get_urgency_display()}] {self.title}"

    def ack(self, user=None):
        self.status = "ack"
        self.acknowledged_at = timezone.now()
        if user and not self.processed_by:
            self.processed_by = user
        self.save(update_fields=["status","acknowledged_at","processed_by"])

    def mark_done(self, user=None):
        self.status = "done"
        self.processed_at = timezone.now()
        if user:
            self.processed_by = user
        self.save(update_fields=["status","processed_at","processed_by"])