# inventory/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from vaccines.models import Vaccine
from .models import VaccineStockLot, InventoryAlert  
from .serializers import StockLotSerializer, InventoryAlertSerializer
from django.core.mail import send_mail
from django.conf import settings


class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    # GET /api/inventory/low-stock/?threshold=20
    @action(detail=False, methods=["GET"], url_path="low-stock")
    def low_stock(self, request):
        threshold = request.query_params.get("threshold")
        try: threshold = int(threshold) if threshold is not None else None
        except: threshold = None

        # tổng khả dụng theo vaccine
        agg = (VaccineStockLot.objects
               .filter(is_active=True)
               .values("vaccine")
               .annotate(available=Sum("quantity_available")))
        result = []
        for a in agg:
            v = Vaccine.objects.get(id=a["vaccine"])
            thr = threshold if threshold is not None else (v.low_stock_threshold or 20)
            if (a["available"] or 0) <= thr:
                result.append({
                    "vaccine_id": v.id,
                    "vaccine_name": v.name,
                    "available": a["available"] or 0,
                    "threshold": thr,
                })
        return Response(result)

    # GET /api/inventory/expiring-soon/?days=30
    @action(detail=False, methods=["GET"], url_path="expiring-soon")
    def expiring_soon(self, request):
        days = int(request.query_params.get("days") or 30)
        today = timezone.now().date()
        soon = today + timedelta(days=days)
        qs = VaccineStockLot.objects.filter(
            is_active=True, expiry_date__gte=today, expiry_date__lte=soon
        ).select_related("vaccine").order_by("expiry_date", "vaccine__name")
        return Response(StockLotSerializer(qs, many=True).data)

    # GET /api/inventory/stock-summary/
    @action(detail=False, methods=["GET"], url_path="stock-summary")
    def stock_summary(self, request):
        # gom theo vaccine, active
        lots = (VaccineStockLot.objects
                .filter(is_active=True)
                .select_related("vaccine")
                .order_by("expiry_date"))
        result = {}
        for lot in lots:
            vid = lot.vaccine_id
            if vid not in result:
                result[vid] = {
                    "vaccine_id": vid,
                    "vaccine_name": lot.vaccine.name,
                    "unit": lot.vaccine.unit,
                    "available_total": 0,
                    "soonest_expiry": None,
                    "first_lot_number": None,
                    "lots": []
                }
            result[vid]["available_total"] += lot.quantity_available or 0
            if result[vid]["soonest_expiry"] is None or lot.expiry_date < result[vid]["soonest_expiry"]:
                result[vid]["soonest_expiry"] = lot.expiry_date
                result[vid]["first_lot_number"] = lot.lot_number
            # rút gọn list lô (tuỳ ý)
            result[vid]["lots"].append({
                "id": lot.id,
                "lot_number": lot.lot_number,
                "expiry_date": lot.expiry_date,
                "quantity_available": lot.quantity_available,
                "location": lot.location
            })
        return Response(list(result.values()))


    # POST /api/inventory/notify-admin/
    # body: { vaccine_id, title, message, desired_qty, urgency?: low|normal|high }
    @action(detail=False, methods=["POST"], url_path="notify-admin")
    def notify_admin(self, request):
        vaccine_id = request.data.get("vaccine_id")
        title = (request.data.get("title") or "").strip() or "Thông báo tồn kho"
        message = request.data.get("message") or ""
        desired_qty = request.data.get("desired_qty")
        urgency = request.data.get("urgency") or "normal"

        try:
            vaccine = Vaccine.objects.get(id=int(vaccine_id))
        except Exception:
            return Response({"error": "vaccine_id không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        alert = InventoryAlert.objects.create(
            vaccine=vaccine,
            title=title,
            message=message,
            desired_qty=int(desired_qty) if str(desired_qty).isdigit() else None,
            urgency=urgency if urgency in ("low","normal","high") else "normal",
            created_by=request.user,
        )

        # gửi email cho admin nếu cấu hình
        recipients = getattr(settings, "ALERT_EMAILS", [])
        if recipients:
            try:
                subject = f"[{alert.get_urgency_display()}] {alert.title}"
                body = (
                    f"Vắc xin: {vaccine.name}\n"
                    f"Số lượng mong muốn: {alert.desired_qty or '—'}\n"
                    f"Người gửi: {request.user.get_full_name() or request.user.email}\n\n"
                    f"{alert.message or ''}"
                )
                send_mail(subject, body, getattr(settings, "DEFAULT_FROM_EMAIL", None), recipients, fail_silently=True)
            except Exception:
                pass

        return Response(InventoryAlertSerializer(alert).data, status=status.HTTP_201_CREATED)

    # Hai action nhỏ cho admin thao tác nhanh trên alert
    @action(detail=False, methods=["POST"], url_path="alerts/(?P<pk>[^/.]+)/ack", permission_classes=[permissions.IsAdminUser])
    def alert_ack(self, request, pk=None):
        try:
            alert = InventoryAlert.objects.get(pk=pk)
        except InventoryAlert.DoesNotExist:
            return Response({"error": "Không tìm thấy"}, status=404)
        alert.ack(user=request.user)
        return Response(InventoryAlertSerializer(alert).data)

    @action(detail=False, methods=["POST"], url_path="alerts/(?P<pk>[^/.]+)/done", permission_classes=[permissions.IsAdminUser])
    def alert_done(self, request, pk=None):
        try:
            alert = InventoryAlert.objects.get(pk=pk)
        except InventoryAlert.DoesNotExist:
            return Response({"error": "Không tìm thấy"}, status=404)
        alert.mark_done(user=request.user)
        return Response(InventoryAlertSerializer(alert).data)