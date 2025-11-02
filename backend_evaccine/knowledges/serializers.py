# knowledge/serializers.py
from rest_framework import serializers
from .models import KnowledgeArticle, KnowledgeCategory

class KnowledgeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = "__all__"


# knowledge/serializers.py
class KnowledgeArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeArticle
        fields = "__all__"
        read_only_fields = ["author", "approved_by", "published_at", "slug", "created_at", "updated_at"]

    def get_author_name(self, obj):
        user = obj.author
        if not user:
            return None
        # ưu tiên full_name (vì bạn có trường này)
        if getattr(user, "full_name", None):
            return user.full_name
        # nếu có get_full_name thì xài
        if hasattr(user, "get_full_name"):
            return user.get_full_name()
        # fallback email
        if getattr(user, "email", None):
            return user.email
        # fallback cuối cùng: str(user)
        return str(user)

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["author"] = request.user
        return super().create(validated_data)
