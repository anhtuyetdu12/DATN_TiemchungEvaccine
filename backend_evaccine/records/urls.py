# records/urls.py
from rest_framework.routers import DefaultRouter
from .views import FamilyMemberViewSet, DiseaseViewSet, VaccineViewSet, VaccinationRecordViewSet, AppointmentViewSet

router = DefaultRouter()
router.register(r'family-members', FamilyMemberViewSet, basename="familymember")
router.register(r'diseases', DiseaseViewSet)
router.register(r'vaccines', VaccineViewSet)
router.register(r'vaccination-records', VaccinationRecordViewSet, basename="vaccinationrecord")
router.register(r'appointments', AppointmentViewSet, basename="appointment")

urlpatterns = router.urls
