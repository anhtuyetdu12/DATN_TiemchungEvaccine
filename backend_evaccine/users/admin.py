from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MedicalStaff


# Inline cho MedicalStaff
class MedicalStaffInline(admin.StackedInline):
    model = MedicalStaff
    can_delete = False
    verbose_name = "Thông tin nhân viên y tế"
    verbose_name_plural = "Thông tin nhân viên y tế"
    fields = ('department', 'specialization', 'license_number', 'work_shift', 'status', 'notes')    #'hire_date',
    readonly_fields = ('hire_date',)



# --- CustomUserAdmin ---
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('full_name', 'email', 'role', 'status', 'last_login')
    list_filter = ('role', 'status')
    search_fields = ('email', 'full_name')
    ordering = ('email',)


    # Thêm / sửa các field khi thêm user mới
    add_fieldsets = (
        ("Thông tin tài khoản", {
            'classes': ('wide',),
            'fields': ('full_name', 'email', 'password1', 'password2', 'role', 'phone', 'status', 'is_staff', 'is_superuser'),
        }),
    )

    # Chỉnh sửa user
    fieldsets = (
        ( "Thông tin cơ bản", {'fields': ('full_name', 'email', 'password', 'role', 'phone', 'status', 'is_staff', 'is_superuser')}),
        ("Phân quyền & hệ thống",{'fields': ('groups', 'user_permissions')}),
        ("Các mốc thời gian", {'fields': ('last_login',)}), 
    )

    search_fields = ('email', 'full_name')
    ordering = ('email',)

    # --- Tự động tạo MedicalStaff khi user mới là staff ---
    def save_model(self, request, obj, form, change):
        is_new = obj.pk is None  # True nếu tạo mới
        super().save_model(request, obj, form, change)

        if is_new and obj.role == 'staff':
            # Nếu chưa tồn tại MedicalStaff tương ứng thì tạo
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

# --- MedicalStaffAdmin để edit thông tin sau khi tạo ---
@admin.register(MedicalStaff)
class MedicalStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'specialization', 'license_number', 'work_shift', 'hire_date', 'status')
    search_fields = ('user__full_name', 'department', 'specialization', 'license_number')
    list_filter = ('work_shift', 'status')
