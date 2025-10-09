from django.db import models
from django.conf import settings
from django.utils import timezone



# -------------------------
# Disease (Bệnh)
# -------------------------
class Disease(models.Model):
    name = models.CharField("Tên bệnh", max_length=255)
    description = models.TextField("Mô tả bệnh", blank=True, null=True)
    cause = models.TextField("Nguyên nhân", blank=True, null=True)
    symptom = models.TextField("Triệu chứng", blank=True, null=True)
    prevention = models.TextField("Phòng ngừa", blank=True, null=True)
    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=(("active", "Đang hoạt động"), ("inactive", "Ngừng hoạt động")),
        default="active"
    )
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Bệnh"
        verbose_name_plural = "Danh sách bệnh"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name



# -------------------------
# Vaccine Category
# -------------------------
class VaccineCategory(models.Model):
    name = models.CharField("Tên danh mục", max_length=255)
    description = models.TextField("Mô tả", blank=True, null=True)
    image = models.ImageField("Hình ảnh danh mục", upload_to="vaccine_categories/", blank=True, null=True)
    status = models.BooleanField("Trạng thái hiển thị", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    class Meta:
        verbose_name = "Danh mục vắc xin"
        verbose_name_plural = "Danh sách danh mục vắc xin"
        ordering = ["-created_at"]
    def __str__(self):
        return self.name



# -------------------------
# Vaccine
# -------------------------
class Vaccine(models.Model):
    category = models.ForeignKey(
        "VaccineCategory", on_delete=models.SET_NULL, null=True, related_name="vaccines", verbose_name="Danh mục vắc xin"
    )
    disease = models.ForeignKey(
        Disease, on_delete=models.CASCADE, related_name="vaccines", verbose_name="Bệnh phòng ngừa"
    )
    name = models.CharField("Tên vắc xin", max_length=255)
    manufacturer = models.CharField("Nhà sản xuất", max_length=255, blank=True, null=True)
    origin = models.CharField("Xuất xứ", max_length=100, blank=True, null=True)
    vaccine_type = models.CharField("Loại vắc xin", max_length=255, blank=True, null=True)
    UNIT_CHOICES = (
        ("liều", "Liều"),
        ("chai", "Chai"),
        ("lọ", "Lọ"),
        ("hộp", "Hộp"),
    )
    unit = models.CharField("Đơn vị tính", max_length=50, choices=UNIT_CHOICES, default="liều")
    price = models.DecimalField("Giá tiền", max_digits=12, decimal_places=2, blank=True, null=True)
    doses_required = models.IntegerField("Phác đồ điều trị", default=1)
    interval_days = models.IntegerField("Khoảng cách giữa các mũi tiêm (ngày)", blank=True, null=True)
    age_group = models.CharField("Độ tuổi áp dụng", max_length=100, blank=True, null=True)
    indications = models.TextField("Chỉ định", blank=True, null=True)
    contraindications = models.TextField("Chống chỉ định", blank=True, null=True)
    storage_requirements = models.CharField("Điều kiện bảo quản", max_length=255, blank=True, null=True)
    side_effects = models.TextField("Tác dụng phụ", blank=True, null=True)
    description = models.TextField("Mô tả chi tiết", blank=True, null=True)
    approval_date = models.DateField("Ngày phê duyệt", default=timezone.now, blank=True, null=True)
    image = models.ImageField("Hình ảnh ", upload_to="vaccines/", blank=True, null=True)
    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=(("active", "Hoạt động"), ("inactive", "Ngừng hoạt động")),
        default="active",
    )
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Vắc xin"
        verbose_name_plural = "Danh sách vắc xin"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


# -------------------------
# Vaccine Package
# -------------------------
class VaccinePackageGroup(models.Model):
    title = models.CharField("Tên nhóm gói (VD: 6 gói theo độ tuổi)", max_length=255)
    description = models.TextField("Mô tả nhóm", blank=True, null=True)
    order = models.PositiveIntegerField("Thứ tự hiển thị", default=0)
    status = models.BooleanField("Hiển thị", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    class Meta:
        verbose_name = "Nhóm gói tiêm"
        verbose_name_plural = "Danh sách nhóm gói tiêm"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
    
class VaccinePackage(models.Model):
    group = models.ForeignKey(
        VaccinePackageGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packages",
        verbose_name="Thuộc nhóm gói"
    )
    name = models.CharField("Tên gói vắc xin", max_length=255)
    description = models.TextField("Mô tả", blank=True, null=True)
    image = models.ImageField(upload_to="package_images/", blank=True, null=True)
    status = models.BooleanField("Kích hoạt", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    class Meta:
        verbose_name = "Gói vắc xin"
        verbose_name_plural = "Danh sách gói vắc xin"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class VaccinePackageDisease(models.Model):
    package = models.ForeignKey(
        VaccinePackage, on_delete=models.CASCADE, related_name="disease_groups"
    )
    disease = models.ForeignKey(
        Disease, on_delete=models.CASCADE, related_name="package_diseases"
    )
    vaccines = models.ManyToManyField(
        Vaccine, related_name="package_disease_vaccines", verbose_name="Danh sách vắc xin cho bệnh này"
    )

    class Meta:
        verbose_name = "Bệnh trong gói tiêm"
        verbose_name_plural = "Danh sách bệnh trong gói tiêm"

    def __str__(self):
        return f"{self.package.name} - {self.disease.name}"
# -------------------------
# Booking
# -------------------------
class Booking(models.Model):
    user = models.ForeignKey("users.CustomUser", on_delete=models.CASCADE, verbose_name="Người đặt")
    vaccine = models.ForeignKey(Vaccine, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Vắc xin")
    package = models.ForeignKey(VaccinePackage, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Gói tiêm")
    appointment_date = models.DateField("Ngày hẹn tiêm", blank=True, null=True)
    appointment_time = models.TimeField("Giờ hẹn tiêm", blank=True, null=True)
    location = models.CharField("Địa điểm tiêm", max_length=255, blank=True, null=True)
    status = models.CharField(
        "Trạng thái lịch hẹn",
        max_length=20,
        choices=(
            ("pending", "Chờ xác nhận"),
            ("confirmed", "Đã xác nhận"),
            ("completed", "Đã tiêm xong"),
            ("cancelled", "Đã hủy"),
        ),
        default="pending",
    )
    notes = models.TextField("Ghi chú thêm", blank=True, null=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Lịch hẹn tiêm"
        verbose_name_plural = "Danh sách lịch hẹn tiêm"
        ordering = ["-created_at"]
    def __str__(self):
        return f"Lịch hẹn của {self.user.full_name} - {self.appointment_date}"

