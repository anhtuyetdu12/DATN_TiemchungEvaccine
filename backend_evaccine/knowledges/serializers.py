# knowledge/serializers.py
from rest_framework import serializers
from .models import KnowledgeArticle, KnowledgeCategory

class KnowledgeCategorySerializer(serializers.ModelSerializer):
    """
    KnowledgeCategorySerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize dữ liệu danh mục bài viết.

    Notes:
        - Dùng cho cả admin CMS và public API
    """

    class Meta:
        model = KnowledgeCategory
        fields = "__all__"

class KnowledgeArticleSerializer(serializers.ModelSerializer):
    """
    KnowledgeArticleSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize dữ liệu bài viết kiến thức.

    Business Meaning:
        Trả dữ liệu bài viết cho:
            - CMS quản trị
            - Trang kiến thức public

    Notes:
        - author & approved_by là read-only
        - slug & published_at do hệ thống quản lý
    """
    author_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeArticle
        fields = "__all__"
        read_only_fields = [
            "author",
            "approved_by",
            "published_at",
            "slug",
            "created_at",
            "updated_at",
        ]
    def get_author_name(self, obj):
        user = obj.author
        if not user:
            return None
        if getattr(user, "full_name", None):
            return user.full_name
        if hasattr(user, "get_full_name"):
            return user.get_full_name()
        if getattr(user, "email", None):
            return user.email
        return str(user)
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["author"] = request.user
        return super().create(validated_data)
