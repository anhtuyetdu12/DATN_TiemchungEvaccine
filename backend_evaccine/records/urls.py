# app: records/urls.py
from rest_framework.routers import DefaultRouter
from .views import FamilyMemberViewSet, VaccinationRecordViewSet

router = DefaultRouter()
router.register(r"family-members", FamilyMemberViewSet, basename="family-member")
router.register(r"vaccinations", VaccinationRecordViewSet, basename="vaccination")

urlpatterns = router.urls
