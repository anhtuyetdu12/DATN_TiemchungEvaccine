# app: records/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import FamilyMemberViewSet, VaccinationRecordViewSet, RemainingDosesView

router = DefaultRouter()
router.register(r"family-members", FamilyMemberViewSet, basename="family-member")
router.register(r"vaccinations", VaccinationRecordViewSet, basename="vaccination")

urlpatterns = [
    *router.urls,
    path("remaining-doses/", RemainingDosesView.as_view()),
]
