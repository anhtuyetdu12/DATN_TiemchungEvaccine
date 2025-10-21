from rest_framework.routers import DefaultRouter
from .views import (
     DiseaseViewSet, VaccineCategoryViewSet,
    VaccineViewSet, VaccinePackageViewSet, VaccinePackageGroupViewSet
)
from django.urls import path, include
router = DefaultRouter()

router.register(r"diseases", DiseaseViewSet)
router.register(r"categories", VaccineCategoryViewSet)
router.register(r"vaccines", VaccineViewSet)
router.register(r"packages", VaccinePackageViewSet)
router.register(r'package-groups', VaccinePackageGroupViewSet)

by_age_view = VaccineViewSet.as_view({'get': 'by_age'})
urlpatterns = [
    path('', include(router.urls)),
    path('by-age/', by_age_view, name='vaccine-by-age'),  # <-- alias
]
