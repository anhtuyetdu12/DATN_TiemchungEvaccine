# inventory/urls.py
from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet

router = DefaultRouter()
router.register(r"stock", InventoryViewSet, basename="inventory")
urlpatterns = router.urls
