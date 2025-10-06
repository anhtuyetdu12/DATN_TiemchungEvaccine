
from django.contrib import admin
from django.urls import path, include ,re_path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/users/", include("users.urls")),       # user module
    path("api/records/", include("records.urls")),   # record module
    path("api/vaccines/", include("vaccines.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
