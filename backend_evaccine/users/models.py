from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings

# qly người dùng
class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email phải được cung cấp")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)  # Hash password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, full_name, password, **extra_fields)

# người dùng
class CustomUser(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField("Họ và tên", max_length=255, default="Unknown")
    email = models.EmailField("Email đăng nhập", unique=True)
    phone = models.CharField("Số điện thoại", max_length=15, blank=True, null=True)
    gender = models.CharField( "Giới tính",max_length=10, choices=[("male", "Nam"), ("female", "Nữ"), ("other", "Khác")], blank=True, null=True,)
    date_of_birth = models.DateField("Ngày sinh",blank=True, null=True)
    role = models.CharField("Vai trò",max_length=20, choices=[('admin','admin'),('staff','staff'),('customer','customer')])
    must_change_password = models.BooleanField(default=False)
    last_login = models.DateTimeField("Lần đăng nhập gần nhất",blank=True, null=True)
    status = models.CharField("Trạng thái",max_length=20, default='active', choices=[('active','active'),('inactive','inactive')])
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)
    updated_at = models.DateTimeField("Ngày cập nhật", auto_now=True)

    is_staff = models.BooleanField("Có quyền vào trang quản trị", default=False)
    is_active = models.BooleanField("Được phép đăng nhập", default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'   # Dùng email làm login
    REQUIRED_FIELDS = ['full_name']  # Khi tạo superuser sẽ bắt điền

    def __str__(self):
        return self.email
    class Meta:
        ordering = ['-created_at']   # mặc định sắp xếp user mới nhất trước
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"


# nhân viên y tế
class MedicalStaff(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True ,verbose_name="Người dùng")
    department = models.CharField("Khoa / phòng ban", max_length=100)
    specialization = models.CharField("Chuyên môn", max_length=100)
    license_number = models.CharField("Số chứng chỉ hành nghề", max_length=50)
    work_shift = models.CharField("Ca làm việc", max_length=50)
    hire_date = models.DateField("Ngày bắt đầu làm việc", auto_now_add=True)
    status = models.CharField("Trạng thái", max_length=20, default="active")
    notes = models.TextField("Ghi chú thêm", blank=True, null=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.department}"
    
    class Meta:
        verbose_name = "Nhân viên y tế"
        verbose_name_plural = "Nhân viên y tế"