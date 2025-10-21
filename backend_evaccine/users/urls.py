from django.urls import path
from .views import ( RegisterAPIView, LoginAPIView, ForgotPasswordAPIView, CreateStaffAPIView,
    ResetPasswordAPIView, LogoutAPIView, StaffCreateCustomerAPIView
)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    path('admin/create-staff/', CreateStaffAPIView.as_view(), name='create-staff'),
    path("staff/create-customer/", StaffCreateCustomerAPIView.as_view(), name="staff-create-customer"),
  
]