# inventory/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import VaccineStockLot, BookingAllocation


@admin.register(VaccineStockLot)
class VaccineStockLotAdmin(admin.ModelAdmin):
    list_display = ("vaccine", "lot_number", "expiry_date", "quantity_available_badge", "is_active", "location")
    list_filter = ("is_active", "expiry_date", "vaccine")
    search_fields = ("lot_number", "vaccine__name")

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
        return format_html('<span style="background:{};color:{};padding:2px 8px;border-radius:999px;font-weight:600;">{}</span>', bg, fg, text)
    quantity_available_badge.short_description = "Khả dụng"

@admin.register(BookingAllocation)
class BookingAllocationAdmin(admin.ModelAdmin):
    list_display = ("booking_item", "lot", "quantity", "status", "reserved_at")
    list_filter = ("status", "lot__vaccine")
