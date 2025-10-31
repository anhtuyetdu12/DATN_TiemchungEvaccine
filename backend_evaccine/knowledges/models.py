# knowledge/models.py
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class KnowledgeCategory(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)  # vd: HEALTH, DISEASE, TARGET_GROUP
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class KnowledgeArticle(models.Model):
    STATUS_CHOICES = (
        ("draft", "Nháp"),
        ("pending", "Chờ duyệt"),
        ("published", "Đã xuất bản"),
        ("rejected", "Từ chối"),
    )
    VISIBILITY_CHOICES = (
        ("normal", "Bình thường"),
        ("featured", "Nổi bật trang chính"),
        ("multimedia", "Hiển thị block Multimedia"),
    )

    title = models.CharField("Tiêu đề", max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    category = models.ForeignKey(
        KnowledgeCategory, on_delete=models.SET_NULL, null=True, related_name="articles"
    )
    summary = models.TextField("Tóm tắt", blank=True, null=True)
    content = models.TextField("Nội dung")  # để staff nhập HTML/markdown
    thumbnail = models.ImageField(upload_to="knowledge_thumbs/", blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="normal")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="knowledge_articles"
    )
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_articles"
    )
    published_at = models.DateTimeField(blank=True, null=True)

    # để map sang “Thông tin vắc xin theo Đối tượng” của bạn
    disease = models.ForeignKey("vaccines.Disease", on_delete=models.SET_NULL, null=True, blank=True)
    vaccine = models.ForeignKey("vaccines.Vaccine", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title or "") or "bai-viet"
            slug = base
            i = 1
            while KnowledgeArticle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug

        # nếu admin chuyển sang published mà chưa có published_at
        if self.status == "published" and self.published_at is None:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)
