# knowledge/serializers.py
from rest_framework import serializers
from .models import KnowledgeArticle, KnowledgeCategory

class KnowledgeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = "__all__"


class KnowledgeArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeArticle
        fields = "__all__"
        read_only_fields = ["author", "approved_by", "published_at", "slug", "created_at", "updated_at"]

    def get_author_name(self, obj):
        return getattr(obj.author, "get_full_name", lambda: obj.author.username)() if obj.author else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["author"] = request.user
        return super().create(validated_data)
