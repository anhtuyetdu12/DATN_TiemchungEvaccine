# inventory/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

from .models import VaccineStockLot, BookingAllocation


@admin.register(VaccineStockLot)
class VaccineStockLotAdmin(admin.ModelAdmin):
    list_display = (
        "vaccine", "lot_number", "expiry_date",
        "quantity_available_badge", "status_badge",
        "is_active", "location"
    )
    list_filter = ("is_active", "expiry_date", "vaccine")
    search_fields = ("lot_number", "vaccine__name")

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        # chỉ khi có ?issues=1 mới lọc các lô cảnh báo
        if request.GET.get("issues") == "1":
            today = timezone.now().date()
            soon = today + timedelta(days=30)

            qs = qs.select_related("vaccine").filter(is_active=True)

            problem_ids = []
            for lot in qs:
                qty = lot.quantity_available or 0
                # ngưỡng sắp hết theo vaccine, mặc định 20
                threshold = getattr(lot.vaccine, "low_stock_threshold", 20) or 20

                is_out_of_stock = qty <= 0
                is_low_stock = qty <= threshold
                is_expired = lot.expiry_date < today
                is_expiring_soon = today <= lot.expiry_date <= soon

                if is_out_of_stock or is_low_stock or is_expired or is_expiring_soon:
                    problem_ids.append(lot.id)

            qs = qs.filter(id__in=problem_ids)

        return qs

    def quantity_available_badge(self, obj):
        q = obj.quantity_available or 0
        if q == 0:
            bg, fg = "#fee2e2", "#b91c1c"
            text = "Hết"
        elif q <= (getattr(obj.vaccine, "low_stock_threshold", 20) or 20):
            bg, fg = "#fef9c3", "#92400e"
            text = f"Sắp hết ({q})"
        else:
            bg, fg = "#dcfce7", "#166534"
            text = q
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;'
            'border-radius:999px;font-weight:600;">{}</span>',
            bg, fg, text
        )
    quantity_available_badge.short_description = "Khả dụng"

    def status_badge(self, obj):
        today = timezone.now().date()
        if obj.expiry_date < today:
            return format_html('<span style="color:#b91c1c;font-weight:600;">Hết hạn</span>')
        days_left = (obj.expiry_date - today).days
        if days_left <= 30:
            return format_html(
                '<span style="color:#ca8a04;font-weight:600;">Sắp hết hạn (còn {} ngày)</span>',
                days_left
            )
        if obj.quantity_available == 0:
            return format_html('<span style="color:#b91c1c;font-weight:600;">Hết hàng</span>')
        return format_html('<span style="color:#15803d;font-weight:600;">Bình thường</span>')
    status_badge.short_description = "Trạng thái"

@admin.register(BookingAllocation)
class BookingAllocationAdmin(admin.ModelAdmin):
    list_display = ("booking_item", "lot", "quantity", "status", "reserved_at")
    list_filter = ("status", "lot__vaccine")
