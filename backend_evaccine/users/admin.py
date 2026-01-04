from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MedicalStaff


class MedicalStaffInline(admin.StackedInline):
    model = MedicalStaff
    can_delete = False
    verbose_name = "Thông tin nhân viên y tế"
    verbose_name_plural = "Thông tin nhân viên y tế"
    fields = ('department', 'specialization', 'license_number', 'work_shift', 'status', 'notes')  
    readonly_fields = ('hire_date',)



class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('full_name', 'email', 'role', 'status', 'last_login')
    list_filter = ('role', 'status')
    search_fields = ('email', 'full_name')
    ordering = ('email',)


    add_fieldsets = (
        ("Thông tin tài khoản", {
            'classes': ('wide',),
            'fields': ('full_name', 'email', 'password1', 'password2', 'role', 'phone', 'status', 'is_staff', 'is_superuser'),
        }),
    )

    fieldsets = (
        ( "Thông tin cơ bản", {'fields': ('full_name', 'email', 'password', 'role', 'phone', 'status', 'is_staff', 'is_superuser')}),
        ("Phân quyền & hệ thống",{'fields': ('groups', 'user_permissions')}),
        ("Các mốc thời gian", {'fields': ('last_login',)}), 
    )

    search_fields = ('email', 'full_name')
    ordering = ('email',)

    def save_model(self, request, obj, form, change):
        is_new = obj.pk is None
        super().save_model(request, obj, form, change)

        if is_new and obj.role == 'staff':
            MedicalStaff.objects.get_or_create(
                user=obj,
                defaults={
                    'department': '',
                    'specialization': '',
                    'license_number': '',
                    'work_shift': 'sáng',
                    'notes': '',
                    'status': 'active',
                }
            )

admin.site.register(CustomUser, CustomUserAdmin)
@admin.register(MedicalStaff)
class MedicalStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'specialization', 'license_number', 'work_shift', 'hire_date', 'status')
    search_fields = ('user__full_name', 'department', 'specialization', 'license_number')
    list_filter = ('work_shift', 'status')
