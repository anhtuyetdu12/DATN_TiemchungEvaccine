# knowledge/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import KnowledgeArticle, KnowledgeCategory
from .serializers import KnowledgeArticleSerializer, KnowledgeCategorySerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import os
from django.utils import timezone

class IsAdminOrAuthorCanEdit(permissions.BasePermission):
    """
    IsAdminOrAuthorCanEdit

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Kiểm soát quyền sửa/xoá bài viết kiến thức.

    Business Rule:
        - Admin: sửa/xoá mọi bài
        - Author: chỉ sửa khi bài ở trạng thái draft hoặc pending
        - Không cho sửa bài đã published

    Notes:
        - Áp dụng ở object-level permission
    """
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return obj.author == request.user and obj.status in ["draft", "pending"]

class KnowledgeCategoryViewSet(viewsets.ModelViewSet):
    """
    KnowledgeCategoryViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        API CRUD danh mục bài viết kiến thức.

    Business Meaning:
        Admin quản lý danh mục hiển thị cho hệ thống kiến thức.

    Notes:
        - Chỉ lấy danh mục đang active
        - Sắp xếp theo order
    """

    queryset = KnowledgeCategory.objects.filter(is_active=True).order_by("order")
    serializer_class = KnowledgeCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    """
    KnowledgeArticleViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Quản lý API bài viết kiến thức + luồng duyệt nội dung.

    Business Meaning:
        Đóng vai trò CMS cho:
            - staff viết bài
            - admin duyệt & xuất bản
            - user đọc nội dung public

    Workflow:
        - create → draft
        - submit → pending
        - approve → published
        - reject → rejected

    Notes:
        - Permission thay đổi theo action
        - public action không yêu cầu đăng nhập
    """
    
    queryset = (
        KnowledgeArticle.objects.all()
        .select_related("author", "category")
    )
    serializer_class = KnowledgeArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdminOrAuthorCanEdit()]
        if self.action in ["public"]:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        status_q = self.request.query_params.get("status")
        category_q = self.request.query_params.get("category")
        visibility_q = self.request.query_params.get("visibility")
        mine = self.request.query_params.get("mine")
        if status_q:
            qs = qs.filter(status=status_q)
        if category_q:
            qs = qs.filter(category_id=category_q)
        if visibility_q:
            qs = qs.filter(visibility=visibility_q)
        if mine == "1":
            qs = qs.filter(author=self.request.user)
        return qs
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """
        Gửi bài viết sang trạng thái chờ duyệt.

        Business Rule:
            - Chỉ author hoặc admin được gửi
            - Không gửi lại bài đã published
        """
        article = self.get_object()
        if article.author != request.user and not request.user.is_staff:
            return Response({"detail": "Bạn không được gửi bài này"}, status=403)
        if article.status == "published":
            return Response({"detail": "Bài đã xuất bản, không thể gửi duyệt lại"}, status=400)
        article.status = "pending"
        article.save()
        return Response(self.get_serializer(article).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Admin duyệt và xuất bản bài viết.

        Notes:
            - Set published_at nếu chưa có
            - Ghi nhận người duyệt
        """
        if not request.user.is_staff:
            return Response({"detail": "Chỉ admin được duyệt"}, status=403)
        article = self.get_object()
        article.status = "published"
        article.approved_by = request.user
        if article.published_at is None:
            article.published_at = timezone.now()
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

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def public(self, request):
        """
        API lấy danh sách bài viết công khai.

        Business Meaning:
            FE dùng để hiển thị trang kiến thức cho người dùng.

        Notes:
            - Chỉ lấy bài đã published
            - Có filter visibility & category
        """
        qs = (
            KnowledgeArticle.objects.filter(status="published")
            .select_related("category", "author")
            .order_by("-published_at", "-created_at")
        )
        visibility = request.query_params.get("visibility")
        category = request.query_params.get("category")
        limit = int(request.query_params.get("limit", 20))

        if visibility:
            qs = qs.filter(visibility=visibility)
        if category:
            qs = qs.filter(category_id=category)

        qs = qs[:limit]
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
    @action(
        detail=False,
        methods=["post"],
        url_path="upload-thumbnail",
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[permissions.IsAuthenticated],
    )
    def upload_thumbnail(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "Không có file"}, status=400)
        folder = "knowledge_thumbnails"
        filename = default_storage.save(os.path.join(folder, file_obj.name), file_obj)
        file_url = default_storage.url(filename)
        if hasattr(settings, "MEDIA_URL"):
            if not file_url.startswith("http"):
                file_url = request.build_absolute_uri(file_url)

        return Response({"url": file_url}, status=201)
    