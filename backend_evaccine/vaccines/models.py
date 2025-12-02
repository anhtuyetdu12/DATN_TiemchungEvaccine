from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from django.core.exceptions import ValidationError


# -------------------------
# Disease (Bệnh)
# -------------------------
class Disease(models.Model):
    name = models.CharField("Tên bệnh", max_length=255)
    description = models.TextField("Mô tả bệnh", blank=True, null=True)
    cause = models.TextField("Nguyên nhân", blank=True, null=True)
    symptom = models.TextField("Triệu chứng", blank=True, null=True)
    prevention = models.TextField("Phòng ngừa", blank=True, null=True)
    doses_required = models.IntegerField("Phác đồ điều trị", default=1)
    interval_days = models.IntegerField("Khoảng cách giữa các mũi tiêm (ngày)", blank=True, null=True)
    status = models.CharField( "Trạng thái", max_length=20,
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

    # Khoảng tuổi áp dụng
    min_age = models.IntegerField("Tuổi nhỏ nhất", blank=True, null=True, help_text="VD: 0 hoặc 1")
    max_age = models.IntegerField("Tuổi lớn nhất", blank=True, null=True, help_text="VD: 5 hoặc 12")
    age_unit = models.CharField(
        "Đơn vị tuổi",
        max_length=10,
        default="tuổi",
        choices=(("tuổi", "Tuổi"), ("tháng", "Tháng")),
    )

    # Thông tin mở rộng
    schedule_text = models.TextField(
        "Phác đồ lịch tiêm", blank=True, null=True,
        help_text="VD: Trẻ từ 2 tuổi trở lên tiêm 1 liều cơ bản, nhắc lại sau 5 năm..."
    )
    indications = models.TextField("Chỉ định", blank=True, null=True)
    contraindications = models.TextField("Chống chỉ định", blank=True, null=True)
    storage_requirements = models.CharField("Điều kiện bảo quản", max_length=255, blank=True, null=True)
    side_effects = models.TextField("Tác dụng phụ", blank=True, null=True)
    description = models.TextField("Mô tả chi tiết", blank=True, null=True)
    efficacy_text = models.TextField("Hiệu quả bảo vệ", blank=True, null=True)
    pregnancy_note = models.TextField("Lưu ý với phụ nữ mang thai", blank=True, null=True)
    deferral_note = models.TextField("Hoãn tiêm chủng", blank=True, null=True)
    other_notes = models.TextField("Các chú ý khác", blank=True, null=True)
    approval_date = models.DateField("Ngày phê duyệt", default=timezone.now, blank=True, null=True)
    image = models.ImageField("Hình ảnh ", upload_to="vaccines/", blank=True, null=True)
    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=(("active", "Hoạt động"), ("inactive", "Ngừng hoạt động")),
        default="active",
    )
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True, null=True)
    low_stock_threshold = models.PositiveIntegerField("Ngưỡng cảnh báo tồn thấp", default=20)
    slug = models.SlugField("Slug", max_length=255, unique=True, blank=True, null=True)

    class Meta:
        verbose_name = "Vắc xin"
        verbose_name_plural = "Danh sách vắc xin"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "age_unit", "min_age", "max_age", "disease"]),
        ]
        
    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name or "")
            self.slug = base
            # đảm bảo unique
            i = 1
            Model = self.__class__
            while Model.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{i}"
                i += 1
        super().save(*args, **kwargs)

    def clean(self):
        min_age = self.min_age
        max_age = self.max_age
        unit = self.age_unit or "tuổi"

        if min_age is None:
            raise ValidationError({"min_age": "Bắt buộc nhập độ tuổi nhỏ nhất."})

        if unit == "tuổi":
            if not (0 <= min_age <= 110):
                raise ValidationError({"min_age": "min_age (tuổi) phải trong khoảng 0–110."})
            if max_age is not None and not (0 <= max_age <= 110):
                raise ValidationError({"max_age": "max_age (tuổi) phải trong khoảng 0–110."})
        else:
            if not (0 <= min_age <= 110 * 12):
                raise ValidationError({"min_age": "min_age (tháng) phải trong khoảng 0–1320."})
            if max_age is not None and not (0 <= max_age <= 110 * 12):
                raise ValidationError({"max_age": "max_age (tháng) phải trong khoảng 0–1320."})

        if max_age is not None and min_age > max_age:
            raise ValidationError({"max_age": "max_age phải ≥ min_age."})

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
    slug = models.SlugField("Slug", max_length=255, unique=True, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title or "")
            self.slug = base
            i = 1
            Model = self.__class__
            while Model.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{i}"; i += 1
        super().save(*args, **kwargs)
     
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
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name or "")
            self.slug = base or "goi"
            i = 1
            Model = self.__class__
            while Model.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{i}"; i += 1
        super().save(*args, **kwargs)
        
    class Meta:
        verbose_name = "Gói vắc xin"
        verbose_name_plural = "Danh sách gói vắc xin"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class VaccinePackageDisease(models.Model):
    package = models.ForeignKey(  VaccinePackage, on_delete=models.CASCADE, related_name="disease_groups" )
    disease = models.ForeignKey(  Disease, on_delete=models.CASCADE, related_name="package_diseases")
    vaccines = models.ManyToManyField( Vaccine, related_name="package_disease_vaccines", verbose_name="Danh sách vắc xin cho bệnh này" )
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f"{self.package_id}-{self.disease_id}")
            self.slug = base
            i = 1
            Model = self.__class__
            while Model.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{i}"; i += 1
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Bệnh trong gói tiêm"
        verbose_name_plural = "Danh sách bệnh trong gói tiêm"

    def __str__(self):
        return f"{self.package.name} - {self.disease.name}"

