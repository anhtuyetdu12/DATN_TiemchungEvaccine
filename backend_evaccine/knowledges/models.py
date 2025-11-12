from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone


class KnowledgeCategory(models.Model):
    name = models.CharField("Tên danh mục", max_length=255)
    code = models.CharField("Mã danh mục", max_length=50, unique=True)
    order = models.PositiveIntegerField("Thứ tự hiển thị", default=0)
    is_active = models.BooleanField("Kích hoạt", default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Danh mục bài viết"
        verbose_name_plural = "Danh mục bài viết"

    def __str__(self):
        return self.name


class KnowledgeArticle(models.Model):
    STATUS_CHOICES = [
        ("draft", "Nháp"),
        ("pending", "Chờ duyệt"),
        ("published", "Đã xuất bản"),
        ("rejected", "Từ chối"),
    ]

    VISIBILITY_CHOICES = [
        ("normal", "Bình thường"),
        ("featured", "Nổi bật / thẻ lớn"),
        ("multimedia", "Multimedia / video / infographic"),
    ]

    title = models.CharField("Tiêu đề", max_length=255)
    slug = models.SlugField(
        "Đường dẫn (slug)",
        max_length=255,
        unique=True,
        null=True,
        blank=True
    )
    summary = models.TextField("Tóm tắt", blank=True, null=True)
    content = models.TextField("Nội dung")

    category = models.ForeignKey(
        KnowledgeCategory,
        verbose_name="Danh mục",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )

    visibility = models.CharField(
        "Kiểu hiển thị",
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default="normal",
    )
    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Tác giả",
        on_delete=models.SET_NULL,
        null=True,
        related_name="knowledge_articles",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người duyệt",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_knowledge_articles",
    )

    thumbnail = models.URLField("Ảnh thumbnail", blank=True, null=True)
    disease = models.CharField("Liên quan bệnh", max_length=255, blank=True, null=True)
    vaccine = models.CharField("Liên quan vắc xin", max_length=255, blank=True, null=True)

    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)
    updated_at = models.DateTimeField("Ngày cập nhật", auto_now=True)
    published_at = models.DateTimeField("Ngày xuất bản", blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Bài viết kiến thức"
        verbose_name_plural = "Bài viết kiến thức"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto slug nếu chưa có
        if not self.slug and self.title:
            base_slug = slugify(self.title)[:60]
            slug = base_slug
            i = 1
            from .models import KnowledgeArticle  # tránh circular import
            while KnowledgeArticle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{i}"
                i += 1
            self.slug = slug

        # Nếu status là published mà chưa có published_at thì set
        if self.status == "published" and self.published_at is None:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)
