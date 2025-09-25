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
    full_name = models.CharField(max_length=255,default="Unknown")
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20, choices=[('admin','admin'),('staff','staff'),('customer','customer')])
    must_change_password = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active', choices=[('active','active'),('inactive','inactive')])
    created_at = models.DateTimeField(auto_now_add=True)

    # Dành cho Django auth
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'   # Dùng email làm login
    REQUIRED_FIELDS = ['full_name']  # Khi tạo superuser sẽ bắt điền

    def __str__(self):
        return self.email

# class Department(models.Model):
#     name = models.CharField(max_length=100, unique=True)
#     description = models.CharField(max_length=255, blank=True, null=True)

#     def __str__(self):
#         return self.name
# nhân viên y tế
class MedicalStaff(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    department = models.CharField(max_length=100)          # Khoa/phòng
    specialization = models.CharField(max_length=100)      # Chuyên môn
    license_number = models.CharField(max_length=50)       # Chứng chỉ hành nghề
    work_shift = models.CharField(max_length=50)           # Ca làm việc
    hire_date = models.DateField(auto_now_add=True)        # Ngày tuyển
    status = models.CharField(max_length=20, default="active")
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.department}"