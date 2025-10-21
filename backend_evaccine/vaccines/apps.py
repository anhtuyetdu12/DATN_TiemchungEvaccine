# vaccines/apps.py
from django.apps import AppConfig

class VaccinesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "vaccines"
    verbose_name = "Danh mục vắc xin"
