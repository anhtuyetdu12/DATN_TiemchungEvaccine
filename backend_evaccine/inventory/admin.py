# inventory/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import VaccineStockLot, BookingAllocation, InventoryAlert


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

@admin.register(InventoryAlert)
class InventoryAlertAdmin(admin.ModelAdmin):
    list_display = ("colored_title","vaccine_link","desired_qty","urgency_badge","status_badge","created_by","created_at")
    list_filter = ("urgency","status","created_at","vaccine")
    search_fields = ("title","message","vaccine__name","created_by__email","created_by__first_name","created_by__last_name")
    readonly_fields = ("created_at","acknowledged_at","processed_at")
    autocomplete_fields = ("vaccine","created_by","processed_by")
    actions = ["action_ack","action_done"]
    list_per_page = 25

    fieldsets = (
        ("Thông tin", {"fields": ("vaccine","title","message","desired_qty","urgency","status")}),
        ("Theo dõi", {"fields": ("created_by","created_at","processed_by","acknowledged_at","processed_at")}),
    )

    def colored_title(self, obj):
        color = {"low":"#0369a1","normal":"#059669","high":"#dc2626"}.get(obj.urgency,"#334155")
        return format_html('<strong style="color:{}">{}</strong>', color, obj.title)
    colored_title.short_description = "Tiêu đề"

    def urgency_badge(self, obj):
        m = {"low":("#e0f2fe","#0369a1"), "normal":("#dcfce7","#166534"), "high":("#fee2e2","#991b1b")}
        bg, fg = m.get(obj.urgency, ("#e5e7eb","#111827"))
        return format_html('<span style="background:{};color:{};padding:4px 10px;border-radius:999px;font-weight:600;">{}</span>', bg, fg, obj.get_urgency_display())
    urgency_badge.short_description = "Mức độ"

    def status_badge(self, obj):
        m = {"new":("#ede9fe","#6d28d9"), "ack":("#fff7ed","#c2410c"), "done":("#ecfeff","#155e75")}
        bg, fg = m.get(obj.status, ("#e5e7eb","#111827"))
        return format_html('<span style="background:{};color:{};padding:4px 10px;border-radius:999px;font-weight:600;">{}</span>', bg, fg, obj.get_status_display())
    status_badge.short_description = "Trạng thái"

    def vaccine_link(self, obj):
        if not obj.vaccine:
            return "—"
        return format_html('<a href="/admin/vaccines/vaccine/{}/change/">{}</a>', obj.vaccine_id, obj.vaccine.name)
    vaccine_link.short_description = "Vắc xin"

    @admin.action(description="Đánh dấu ĐÃ TIẾP NHẬN")
    def action_ack(self, request, queryset):
        for a in queryset:
            a.ack(user=request.user)

    @admin.action(description="Đánh dấu ĐÃ XỬ LÝ")
    def action_done(self, request, queryset):
        for a in queryset:
            a.mark_done(user=request.user)