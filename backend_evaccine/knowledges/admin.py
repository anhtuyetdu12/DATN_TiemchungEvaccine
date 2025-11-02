from django.contrib import admin
from django.utils.html import format_html
from .models import KnowledgeArticle, KnowledgeCategory


@admin.register(KnowledgeCategory)
class KnowledgeCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("name", "code")
    ordering = ("order",)
    list_filter = ("is_active",)


@admin.register(KnowledgeArticle)
class KnowledgeArticleAdmin(admin.ModelAdmin):
    list_display = (
        "title", "category",  "author",
        "status_colored", "visibility", "published_at", "created_at",
    )
    list_filter = ("status", "visibility", "category")
    search_fields = ("title", "summary", "content")
    readonly_fields = (  "slug", "created_at", "updated_at", "published_at", "approved_by", )

    fieldsets = (
        (
            "Thông tin bài viết",
            {
                "fields": ( "title", "slug", "category", "summary", "content", "thumbnail", )
            },
        ),
        (
            "Cấu hình hiển thị",
            {"fields": ("visibility", "status", "disease", "vaccine")},
        ),
        (
            "Thông tin hệ thống",
            {
                "fields": ("author", "approved_by", "created_at",  "updated_at", "published_at", )
            },
        ),
    )

    def status_colored(self, obj):
        color_map = {
            "draft": "#9ca3af",
            "pending": "#f59e0b",
            "published": "#10b981",
            "rejected": "#ef4444",
        }
        color = color_map.get(obj.status, "#6b7280")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_colored.short_description = "Trạng thái"

    # hành động tùy chỉnh cho admin
    actions = ["approve_articles", "reject_articles"]

    def approve_articles(self, request, queryset):
        updated = queryset.update(status="published", approved_by=request.user)
        self.message_user(request, f"Đã duyệt {updated} bài viết.")

    approve_articles.short_description = " Duyệt bài viết đã chọn"

    def reject_articles(self, request, queryset):
        updated = queryset.update(status="rejected", approved_by=request.user)
        self.message_user(request, f"Đã từ chối {updated} bài viết.")

    reject_articles.short_description = " Từ chối bài viết đã chọn"
