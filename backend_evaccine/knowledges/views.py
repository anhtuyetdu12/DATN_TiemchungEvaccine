from django.shortcuts import render

# Create your views here.
# knowledge/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import KnowledgeArticle, KnowledgeCategory
from .serializers import KnowledgeArticleSerializer, KnowledgeCategorySerializer

class IsAdminOrAuthorCanEdit(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # admin: full
        if request.user and request.user.is_staff:
            return True
        # staff (bs) chỉ sửa bài của mình nếu chưa publish
        return obj.author == request.user and obj.status in ["draft", "pending"]

class KnowledgeCategoryViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeCategory.objects.filter(is_active=True).order_by("order")
    serializer_class = KnowledgeCategorySerializer
    permission_classes = [permissions.IsAuthenticated]  # hoặc AllowAny nếu muốn FE gọi

class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeArticle.objects.all().select_related("author", "category")
    serializer_class = KnowledgeArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdminOrAuthorCanEdit()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        status_q = self.request.query_params.get("status")
        category_q = self.request.query_params.get("category")
        mine = self.request.query_params.get("mine")

        if status_q:
            qs = qs.filter(status=status_q)
        if category_q:
            qs = qs.filter(category_id=category_q)
        if mine == "1":
            qs = qs.filter(author=self.request.user)
        return qs

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        # staff gửi bài sang trạng thái pending
        article = self.get_object()
        if article.author != request.user and not request.user.is_staff:
            return Response({"detail": "Bạn không được gửi bài này"}, status=403)
        article.status = "pending"
        article.save()
        return Response(self.get_serializer(article).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        # chỉ admin
        if not request.user.is_staff:
            return Response({"detail": "Chỉ admin được duyệt"}, status=403)
        article = self.get_object()
        article.status = "published"
        article.approved_by = request.user
        article.save()
        return Response(self.get_serializer(article).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Chỉ admin được từ chối"}, status=403)
        article = self.get_object()
        article.status = "rejected"
        article.approved_by = request.user
        article.save()
        return Response(self.get_serializer(article).data)
