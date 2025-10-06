from django.contrib import admin
from django.utils.html import format_html
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, Booking,VaccinePackageGroup,  VaccinePackageDisease
import nested_admin

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(VaccineCategory)
class VaccineCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "disease",
        "manufacturer",
        "origin",
        "vaccine_type",
        "age_group",
        "doses_required",
        "status",
        "price",
    )
    list_filter = ("status", "category", "disease", "origin", "vaccine_type")
    search_fields = ("name", "manufacturer", "origin")
    ordering = ("id",)
    list_per_page = 20
    autocomplete_fields = ("category", "disease")
    list_editable = ("status", "price")
    fields = (
        "name",
        "category",
        "disease",
        "manufacturer",
        "origin",
        "vaccine_type",
        "unit",
        "price",
        "doses_required",
        "interval_days",
        "age_group",
        "indications",
        "contraindications",
        "storage_requirements",
        "side_effects",
        "approval_date",
        "description",
        "image",
        "status",
    )

class VaccinePackageDiseaseInline(admin.TabularInline):
    model = VaccinePackageDisease
    extra = 1
    autocomplete_fields = ["disease", "vaccines"]
    verbose_name = "Bệnh trong gói"
    verbose_name_plural = "Danh sách bệnh và vắc xin trong gói"

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        field = super().formfield_for_manytomany(db_field, request, **kwargs)
        if db_field.name == "vaccines":
            field.queryset = Vaccine.objects.all().select_related("disease", "category")
        return field
    
@admin.register(VaccinePackage)
class VaccinePackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "group",  "status", "preview_image")
    list_filter = ("group", "status")
    search_fields = ("name",)
    ordering = ("id",)
    inlines = [VaccinePackageDiseaseInline]

    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": (
                "name",
                "group",
                "description",
                "image",
                "preview_image",
            ),
            "classes": ("wide",),
        }),
        
    )

    readonly_fields = ("preview_image",)

    def preview_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px;border-radius:8px;" />', obj.image.url)
        return "—"
    preview_image.short_description = "Xem ảnh minh họa"
    
@admin.register(VaccinePackageGroup)
class VaccinePackageGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "order", "status")
    ordering = ("order",)
    search_fields = ("title",)
    
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "vaccine", "package", "status", "appointment_date")
    list_filter = ("status",)
    search_fields = ("user__email",)
