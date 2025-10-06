from rest_framework.routers import DefaultRouter
from .views import (
     DiseaseViewSet, VaccineCategoryViewSet,
    VaccineViewSet, VaccinePackageViewSet, BookingViewSet, VaccinePackageGroupViewSet
)

router = DefaultRouter()

router.register(r"diseases", DiseaseViewSet)
router.register(r"categories", VaccineCategoryViewSet)
router.register(r"vaccines", VaccineViewSet)
router.register(r"packages", VaccinePackageViewSet)
router.register(r'package-groups', VaccinePackageGroupViewSet)
router.register(r"bookings", BookingViewSet)

urlpatterns = router.urls
