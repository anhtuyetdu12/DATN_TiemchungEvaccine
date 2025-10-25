# inventory/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from .models import VaccineStockLot
from .serializers import StockLotSerializer
from vaccines.models import Vaccine

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

    # NEW: nhân viên gửi thông báo đến admin
    # POST /api/inventory/notify-admin/
    # payload: { vaccine_id, title, message, desired_qty }
    @action(detail=False, methods=["POST"], url_path="notify-admin")
    def notify_admin(self, request):
        vaccine_id = request.data.get("vaccine_id")
        title = request.data.get("title") or "Thông báo tồn kho"
        message = request.data.get("message") or ""
        desired_qty = request.data.get("desired_qty")
        try:
            v = Vaccine.objects.get(id=int(vaccine_id))
        except Exception:
            return Response({"error": "vaccine_id không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        # Ở đây bạn có thể: ghi DB Notification, gửi email, push,… tuỳ hệ thống.
        # Mình trả về echo để FE hiển thị là OK.
        return Response({
            "ok": True,
            "notified": {
                "vaccine_id": v.id,
                "vaccine_name": v.name,
                "title": title,
                "message": message,
                "desired_qty": desired_qty
            }
        }, status=status.HTTP_200_OK)