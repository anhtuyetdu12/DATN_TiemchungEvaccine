# knowledge/urls.py
from rest_framework.routers import DefaultRouter
from .views import KnowledgeCategoryViewSet, KnowledgeArticleViewSet

router = DefaultRouter()
router.register(r"categories", KnowledgeCategoryViewSet, basename="knowledge-category")
router.register(r"articles", KnowledgeArticleViewSet, basename="knowledge-article")

urlpatterns = router.urls
