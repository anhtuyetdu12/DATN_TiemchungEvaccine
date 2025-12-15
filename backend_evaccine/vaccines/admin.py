# vaccines/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Disease, VaccineCategory, Vaccine, VaccinePackage, VaccinePackageGroup,
    VaccinePackageDisease
)
from django.utils import timezone
from django.contrib import messages
from django.urls import reverse
from urllib.parse import urlencode

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "doses_required", "interval_days", "created_at")
    search_fields = ("name",)
    ordering = ("-created_at",)

    fieldsets = (
        ("Thông tin bệnh", {
            "fields": ("name", "description", "cause", "symptom", "prevention", "status")
        }),
        ("Phác đồ tiêm chủng", {
            "fields": ("doses_required", "interval_days"),
        }),
    )

@admin.register(VaccineCategory)
class VaccineCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)
    ordering = ("-created_at",)


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "category", "disease",
        "manufacturer", "origin", "vaccine_type",
        "min_age", "max_age", "age_unit",
        "colored_status", "formatted_price",
        "stock_status",     "expiry_status",  
    )
    list_filter = ("status", "category", "disease", "origin", "vaccine_type", "age_unit")
    search_fields = ("name", "manufacturer", "origin", "vaccine_type", "description")
    list_per_page = 20
    autocomplete_fields = ("category", "disease")
    list_editable = ()
    ordering = ("-created_at",)

    # --- Trạng thái hoạt động ---
    def colored_status(self, obj):
        colors = {"active": "#16a34a", "inactive": "#ef4444"}
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )
    colored_status.short_description = "Trạng thái"

    # --- Định dạng giá ---
    def formatted_price(self, obj):
        if obj.price is None:
            return "—"
        return f"{obj.price:,.0f} VNĐ"
    formatted_price.short_description = "Giá"

    # --- Helper: tổng tồn kho theo lô ---
    def _total_stock(self, obj):
        return sum(
            (lot.quantity_available or 0)
            for lot in obj.stock_lots.all()
            if getattr(lot, "is_active", True)
        )

    # --- Helper: hạn sử dụng sớm nhất trong các lô còn hàng ---
    def _nearest_expiry(self, obj):
        dates = [
            lot.expiry_date
            for lot in obj.stock_lots.all()
            if getattr(lot, "is_active", True)
            and (lot.quantity_available or 0) > 0
            and lot.expiry_date is not None
        ]
        if not dates:
            return None
        return min(dates)

    # --- Hiển thị tình trạng kho (hết hàng / sắp hết / còn) ---
    def stock_status(self, obj):
        total = self._total_stock(obj)
        if total is None:
            return "—"
        threshold = getattr(obj, "low_stock_threshold", None) or 20
        if total <= 0:
            base_url = reverse("admin:inventory_vaccinestocklot_changelist")
            url = f"{base_url}?{urlencode({'vaccine__id__exact': obj.id, 'issues': 1, 'is_active__exact': 1})}"
            return format_html(
                '<span style="color:#b91c1c;font-weight:600;">Hết hàng</span><br><a href="{}">Xem lô</a>',
                url
            )
        if total <= threshold:
            base_url = reverse("admin:inventory_vaccinestocklot_changelist")
            url = f"{base_url}?{urlencode({'vaccine__id__exact': obj.id, 'issues': 1, 'is_active__exact': 1})}"
            return format_html(
                '<span style="color:#ca8a04;font-weight:600;">Sắp hết ({})</span><br><a href="{}">Xem lô</a>',
                total, url
            )
        return format_html('<span style="color:#15803d;">Còn {}</span>', total)


    # --- Hiển thị trạng thái hạn sử dụng ---
    def expiry_status(self, obj):
        today = timezone.localdate()

        # Các lô đã hết hạn
        expired_lots = obj.stock_lots.filter(
            is_active=True,
            expiry_date__lt=today
        )

        expired_count = expired_lots.count()

        # Nếu có lô hết hạn -> hiển thị đỏ + link xem chi tiết
        if expired_count > 0:
            nearest = expired_lots.order_by("expiry_date").first().expiry_date

            # URL sang trang admin VaccineStockLot, filter theo vaccine & hết hạn
            base_url = reverse("admin:inventory_vaccinestocklot_changelist")
            query_string = urlencode({
                "vaccine__id__exact": obj.id,
                "expiry_date__lt": today.isoformat(),
                "is_active__exact": 1,
            })
            url = f"{base_url}?{query_string}"

            return format_html(
                '<span style="color:#b91c1c;font-weight:600;">{count} lô hết hạn (sớm nhất: {date})</span><br>'
                '<a href="{url}">Xem chi tiết</a>',
                count=expired_count,
                date=nearest.strftime("%d/%m/%Y"),
                url=url,
            )

        # Nếu không có lô hết hạn -> dùng logic cũ (sắp hết hạn / còn hạn)
        nearest = self._nearest_expiry(obj)
        if not nearest:
            return "—"

        if nearest < today:
            # về lý thuyết không vào đây nữa, vì đã bắt ở expired_lots
            return format_html(
                '<span style="color:#b91c1c;font-weight:600;">Hết hạn (lô sớm nhất: {})</span>',
                nearest.strftime("%d/%m/%Y")
            )

        delta = (nearest - today).days
        if delta <= 30:
            return format_html(
                '<span style="color:#ca8a04;font-weight:600;">Sắp hết hạn (còn {} ngày)</span>',
                delta
            )

        return format_html(
            '<span style="color:#15803d;">Còn hạn đến {}</span>',
            nearest.strftime("%d/%m/%Y")
        )
    expiry_status.short_description = "Hạn sử dụng"

    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("name","category","disease","manufacturer","origin","vaccine_type","unit","price","status")
        }),
        ("Phác đồ & độ tuổi", {
            "fields": (("min_age","max_age","age_unit"),"schedule_text")
        }),
        ("Mô tả & khác", {
            "fields": (
                "indications","contraindications","storage_requirements","side_effects","description",
                "efficacy_text","pregnancy_note","deferral_note","other_notes","approval_date","image"
            )
        }),
    )

    # --- Thông báo tổng quan trên danh sách ---
    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(request, extra_context=extra_context)
        if not hasattr(response, "context_data"):
            return response
        cl = response.context_data.get("cl")
        if not cl:
            return response
        qs = cl.queryset.prefetch_related("stock_lots")
        today = timezone.localdate()
        soon = today + timezone.timedelta(days=30)
        problematic_ids = set()
        
        for vaccine in qs:
            threshold = getattr(vaccine, "low_stock_threshold", None) or 20
            lots = [lot for lot in vaccine.stock_lots.all() if getattr(lot, "is_active", True)]
            # nếu vaccine không có lô active thì bỏ qua (tuỳ bạn)
            if not lots:
                continue
            # 1) tồn kho (theo tổng) => hết hàng / sắp hết
            total = sum((lot.quantity_available or 0) for lot in lots)
            has_out_of_stock = total <= 0
            has_low_stock = 0 < total <= threshold
            # 2) hạn dùng (theo từng lô) => hết hạn / sắp hết hạn
            has_expired = any(lot.expiry_date and lot.expiry_date < today for lot in lots)
            has_expiring_soon = any(
                lot.expiry_date and today <= lot.expiry_date <= soon for lot in lots
            )
            if has_out_of_stock or has_low_stock or has_expired or has_expiring_soon:
                problematic_ids.add(vaccine.id)

        problem_count = len(problematic_ids)

        if problem_count > 0:
            base_url = reverse("admin:inventory_vaccinestocklot_changelist")
            query_string = urlencode({
                "issues": 1,
                "is_active__exact": 1,
            })
            url = f"{base_url}?{query_string}"
            messages.warning(
                request,
                format_html(
                    'Cảnh báo kho vắc xin: <b>{}</b> vắc xin đang có vấn đề. '
                    '<a href="{}">Xem tất cả lô có vấn đề</a>',
                    problem_count,
                    url,
                )
            )
        return response

class VaccinePackageDiseaseInline(admin.TabularInline):
    model = VaccinePackageDisease
    extra = 1
    autocomplete_fields = ["disease", "vaccines"]
    verbose_name = "Bệnh trong gói"
    verbose_name_plural = "Bệnh & vắc xin trong gói"

@admin.register(VaccinePackage)
class VaccinePackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "group", "status", "preview_image", "created_at")
    list_filter = ("group", "status")
    search_fields = ("name",)
    ordering = ("-created_at",)
    inlines = [VaccinePackageDiseaseInline]
    readonly_fields = ("preview_image",)

    def preview_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px;border-radius:8px;" />', obj.image.url)
        return "—"
    preview_image.short_description = "Ảnh minh họa"

@admin.register(VaccinePackageGroup)
class VaccinePackageGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "order", "status")
    ordering = ("order",)
    search_fields = ("title",)


