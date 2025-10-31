# knowledge/urls.py
from rest_framework.routers import DefaultRouter
from .views import KnowledgeArticleViewSet, KnowledgeCategoryViewSet

router = DefaultRouter()
router.register(r"categories", KnowledgeCategoryViewSet)
router.register(r"articles", KnowledgeArticleViewSet)

urlpatterns = router.urls
