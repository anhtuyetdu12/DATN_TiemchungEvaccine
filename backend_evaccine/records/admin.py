from django.contrib import admin
from django.utils.html import format_html
from .models import FamilyMember,  VaccinationRecord,  Booking, BookingItem, NotificationRule

# --- Thành viên gia đình ---
@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_user_info",
        "full_name",
        "nickname",
        "phone",
        "relation_vi",
        "gender_vi",
        "date_of_birth",
        "created_at",
    )
    search_fields = ("full_name", "nickname", "phone", "user__email", "user__full_name", "user__phone")
    list_filter = ("gender", "relation", "created_at")
    ordering = ("-created_at",)

    def get_user_info(self, obj):
        user = obj.user
        name = user.full_name or "(Chưa có tên)"
        if getattr(user, "phone", None):
            contact = format_html('<span style="color:#16a34a;">📞 {}</span>', user.phone)
        else:
            contact = format_html('<span style="color:#2563eb;">✉️ {}</span>', user.email)
        return format_html("<b>{}</b><br>{}", name, contact)
    get_user_info.short_description = "Người dùng"

    def relation_vi(self, obj):
        return obj.relation  
    relation_vi.short_description = "Mối quan hệ"

    def gender_vi(self, obj):
        return dict(obj.GENDER_CHOICES).get(obj.gender, "Khác")
    gender_vi.short_description = "Giới tính"



# --- Sổ tiêm chủng ---
@admin.register(VaccinationRecord)
class VaccinationRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "family_member",
        "disease",
        "vaccine",
        "dose_number",
        "vaccine_name",
        "vaccine_lot",
        "vaccination_date",
        "next_dose_date",
        "note",
    )
    list_filter = ("vaccination_date", "disease")
    search_fields = ("family_member__full_name", "vaccine_name", "vaccine_lot", "vaccine__name")
    ordering = ("-vaccination_date", "-id")


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
        return obj.get_status_display()
    status_vi.short_description = "Trạng thái"
    
    def has_module_permission(self, request):
        return request.user.is_superuser or request.user.groups.filter(name="ops").exists()

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


