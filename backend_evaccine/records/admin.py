from django.contrib import admin
from django.utils.html import format_html
from .models import FamilyMember, Appointment, VaccinationRecord
from django.utils.html import format_html

# --- Quản lý thành viên gia đình ---
@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_user_info",  
        "full_name",
        "nickname",
        "phone",
        "relation",
        "gender",
        "date_of_birth",
    )
    search_fields = ("full_name", "nickname", "phone", "user__email", "user__full_name", "user__phone")
    list_filter = ("gender", "relation")
    ordering = ("id",)

    def get_user_info(self, obj):
        user = obj.user
        name = user.full_name or "(Chưa có tên)"
        if user.phone:
            contact = format_html('<span style="color:green;">📞 {}</span>', user.phone)
        else:
            contact = format_html('<span style="color:blue;">✉️ {}</span>', user.email)
        return format_html("<b>{}</b><br>{}", name, contact)
    get_user_info.short_description = "Người dùng"


# --- Quản lý lịch hẹn tiêm ---
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "member", "vaccine", "appointment_date", "colored_status")
    list_filter = ("status", "appointment_date")
    search_fields = ("user__username", "member__full_name", "vaccine__name")
    ordering = ("-appointment_date",)

    def colored_status(self, obj):
        colors = {
            "pending": "orange",
            "confirmed": "green",
            "cancelled": "red",
            "completed": "blue",
        }
        color = colors.get(obj.status, "gray")
        return format_html(f'<b style="color:{color}">{obj.get_status_display()}</b>')

    colored_status.short_description = "Trạng thái"


# --- Quản lý sổ tiêm chủng ---
@admin.register(VaccinationRecord)
class VaccinationRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "family_member",
        "vaccine_name",
        "vaccine_lot",
        "vaccination_date",
        "next_dose_date",
        "note",
    )
    list_filter = ("vaccination_date",)
    search_fields = ("family_member__full_name", "vaccine_name", "vaccine_lot")
    ordering = ("-vaccination_date",)
