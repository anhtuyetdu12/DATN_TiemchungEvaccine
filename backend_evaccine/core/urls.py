
from django.contrib import admin
from django.urls import path, include ,re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView  

admin.site.site_header = "Hệ thống tiêm chủng Evaccine – Trang quản trị"
admin.site.index_title = "Bảng điều khiển"
admin.site.site_title = "Quản trị tiêm chủng"

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/users/", include("users.urls")),       # user module
    path("api/records/", include("records.urls")),   # record module
    path("api/vaccines/", include("vaccines.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

