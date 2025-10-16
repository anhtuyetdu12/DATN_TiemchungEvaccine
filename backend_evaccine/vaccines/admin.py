# vaccines/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Disease, VaccineCategory, Vaccine, VaccinePackage, VaccinePackageGroup,
    VaccinePackageDisease, Booking, BookingItem
)

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")  # "Tên bệnh", "Ngày tạo" lấy từ verbose_name field
    search_fields = ("name",)
    ordering = ("-created_at",)

@admin.register(VaccineCategory)
class VaccineCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)
    ordering = ("-created_at",)

@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "category", "disease",
        "manufacturer", "origin", "vaccine_type",
        "min_age", "max_age", "age_unit",
        "doses_required", "colored_status", "formatted_price",
    )
    list_filter = ("status", "category", "disease", "origin", "vaccine_type", "age_unit")
    search_fields = ("name", "manufacturer", "origin", "vaccine_type", "description")
    list_per_page = 20
    autocomplete_fields = ("category", "disease")
    list_editable = ()
    ordering = ("-created_at",)

    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("name","category","disease","manufacturer","origin","vaccine_type","unit","price","status")
        }),
        ("Phác đồ & độ tuổi", {
            "fields": ("doses_required","interval_days",("min_age","max_age","age_unit"),"schedule_text")
        }),
        ("Mô tả & khác", {
            "fields": (
                "indications","contraindications","storage_requirements","side_effects","description",
                "efficacy_text","pregnancy_note","deferral_note","other_notes","approval_date","image"
            )
        }),
    )

    # --- Hiển thị tiếng Việt có màu cho trạng thái ---
    def colored_status(self, obj):
        colors = {"active": "#16a34a", "inactive": "#ef4444"}
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )
    colored_status.short_description = "Trạng thái"

    # --- Định dạng giá ---
    def formatted_price(self, obj):
        if obj.price is None:
            return "—"
        return f"{obj.price:,.0f} VNĐ"
    formatted_price.short_description = "Giá"

class VaccinePackageDiseaseInline(admin.TabularInline):
    model = VaccinePackageDisease
    extra = 1
    autocomplete_fields = ["disease", "vaccines"]
    verbose_name = "Bệnh trong gói"
    verbose_name_plural = "Bệnh & vắc xin trong gói"

@admin.register(VaccinePackage)
class VaccinePackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "group", "status", "preview_image", "created_at")
    list_filter = ("group", "status")
    search_fields = ("name",)
    ordering = ("-created_at",)
    inlines = [VaccinePackageDiseaseInline]
    readonly_fields = ("preview_image",)

    def preview_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px;border-radius:8px;" />', obj.image.url)
        return "—"
    preview_image.short_description = "Ảnh minh họa"

@admin.register(VaccinePackageGroup)
class VaccinePackageGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "order", "status")
    ordering = ("order",)
    search_fields = ("title",)

class BookingItemInline(admin.TabularInline):
    model = BookingItem
    extra = 0
    autocomplete_fields = ["vaccine"]
    readonly_fields = ["unit_price"]
    verbose_name = "Mục vắc xin"
    verbose_name_plural = "Các vắc xin đã chọn"

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "member", "status_vi", "appointment_date",  "created_at")
    list_filter = ("status", "appointment_date", "created_at")
    search_fields = ("user__email", "user__full_name", "member__full_name")
    ordering = ("-created_at",)
    inlines = [BookingItemInline]

    def status_vi(self, obj):
        # hiện label tiếng Việt của choices (đã đặt sẵn trong model)
        return obj.get_status_display()
    status_vi.short_description = "Trạng thái"
    
    def has_module_permission(self, request):
        # Chỉ cho nhóm 'ops' hay staff đặc biệt xem mục này
        return request.user.is_superuser or request.user.groups.filter(name="ops").exists()

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        # Không cho tạo từ phía vaccines admin
        return False

    def has_change_permission(self, request, obj=None):
        # Tuỳ bạn, có thể False để read-only
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
