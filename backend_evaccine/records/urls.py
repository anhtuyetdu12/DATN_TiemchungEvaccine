# app: records/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    FamilyMemberViewSet, VaccinationRecordViewSet, RemainingDosesView, BookingViewSet,
    StaffCustomerListAPIView, StaffCustomerMembersAPIView, MyUpdateHistoryByDiseaseAPIView,
    StaffCreateAppointmentAPIView, StaffUpdateAppointmentStatusAPIView, StaffManageMemberAPIView, 
    StaffAddHistoryAPIView, StaffListAppointmentsAPIView, StaffUpdateCustomerProfileAPIView, 
    CustomerNotificationPreviewAPIView, MyNotificationMarkReadAPIView, MyNotificationsAPIView
)



router = DefaultRouter()
router.register(r"family-members", FamilyMemberViewSet, basename="family-member")
router.register(r"vaccinations", VaccinationRecordViewSet, basename="vaccination")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    *router.urls,
    path("remaining-doses/", RemainingDosesView.as_view()),
    path("staff/customers/", StaffCustomerListAPIView.as_view(), name="records-staff-customers"),
    path("staff/customers/<int:user_id>/members/", StaffCustomerMembersAPIView.as_view(), name="records-staff-customer-members"),

    path("staff/customers/<int:user_id>/appointments", StaffCreateAppointmentAPIView.as_view(), name="records-staff-appt-create"),
    path("staff/customers/<int:user_id>/appointments/list", StaffListAppointmentsAPIView.as_view(), name="records-staff-appt-list"),
    path("staff/customers/<int:user_id>/appointments/<str:appt_id>", StaffUpdateAppointmentStatusAPIView.as_view(), name="records-staff-appt-update"),

    path("staff/customers/<int:user_id>/history", StaffAddHistoryAPIView.as_view(), name="records-staff-history-add"),
    path("staff/customers/<int:user_id>/profile", StaffUpdateCustomerProfileAPIView.as_view(), name="records-staff-customer-profile"),
    path("staff/customers/<int:user_id>/members", StaffManageMemberAPIView.as_view(), name="records-staff-members-create"),
    path("staff/customers/<int:user_id>/members/<int:member_id>", StaffManageMemberAPIView.as_view(), name="records-staff-members-manage"),
    path("staff/customers/notifications/preview", CustomerNotificationPreviewAPIView.as_view()),
    
    path("me/history/by-disease/", MyUpdateHistoryByDiseaseAPIView.as_view(), name="my-update-history-by-disease"),
    path("me/notifications/", MyNotificationsAPIView.as_view()),
    path("me/notifications/<int:pk>/read", MyNotificationMarkReadAPIView.as_view()),

]
