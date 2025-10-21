# inventory/views.py
from rest_framework import viewsets, permissions
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
