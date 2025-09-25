from django.urls import path
from .views import RegisterAPIView, LoginAPIView, ForgotPasswordAPIView, CreateStaffAPIView, StaffLoginAPIView, ResetPasswordAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
     path('reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    path('admin/create-staff/', CreateStaffAPIView.as_view(), name='create-staff'),
    # path('staff/login/', StaffLoginAPIView.as_view(), name='staff-login'),
    
    
]
