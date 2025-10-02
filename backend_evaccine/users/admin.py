from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MedicalStaff


# Inline cho MedicalStaff
class MedicalStaffInline(admin.StackedInline):
    model = MedicalStaff
    can_delete = False
    verbose_name_plural = 'Medical Staff'
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
        (None, {
            'classes': ('wide',),
            'fields': ('full_name', 'email', 'password1', 'password2', 'role', 'phone', 'status', 'is_staff', 'is_superuser'),
        }),
    )

    # Chỉnh sửa user
    fieldsets = (
        (None, {'fields': ('full_name', 'email', 'password', 'role', 'phone', 'status', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),  # Không include created_at
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
    
    # staff_id INT PRIMARY KEY,              -- Trùng với user_id (1-1 với bảng users)
    # department NVARCHAR(100),              -- Khoa/phòng ban (VD: Nhi, Nội, Tiêm chủng)
    # specialization NVARCHAR(100),          -- Chuyên môn (VD: Bác sĩ, Điều dưỡng, Dược sĩ)
    # license_number NVARCHAR(50),           -- Số chứng chỉ hành nghề
    # work_shift NVARCHAR(50),               -- Ca làm việc (sáng/chiều/tối)
    # hire_date DATE,                        -- Ngày bắt đầu làm việc
    # status NVARCHAR(20) DEFAULT 'active',   -- Trạng thái: active, inactive
	# notes NVARCHAR(MAX)	,				  -- để quản lý thêm thông tin khác (VD: tình trạng công tác)
