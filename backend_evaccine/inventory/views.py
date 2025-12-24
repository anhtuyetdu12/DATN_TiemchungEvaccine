# inventory/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from vaccines.models import Vaccine
from .models import VaccineStockLot  
from .serializers import StockLotSerializer
from django.core.mail import send_mail
from django.conf import settings

# API Quản lý tồn kho vắc xin
class InventoryViewSet(viewsets.ViewSet):
    """
    InventoryViewSet

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Cung cấp API quản lý và thống kê tồn kho vắc xin.

    Business Meaning:
        Dùng cho:
            - dashboard kho
            - cảnh báo sắp hết hàng
            - theo dõi lô sắp hết hạn

    Notes:
        - Chỉ cho người dùng đã đăng nhập
        - Không CRUD trực tiếp VaccineStockLot
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["GET"], url_path="low-stock")
    def low_stock(self, request):
        """
        API cảnh báo vắc xin sắp hết hàng.

        Business Rule:
            - Tổng quantity_available của các lô active
            - So sánh với threshold (query hoặc cấu hình vaccine)

        Notes:
            - Nếu không truyền threshold → dùng low_stock_threshold của vaccine
        """
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

    @action(detail=False, methods=["GET"], url_path="expiring-soon")
    def expiring_soon(self, request):
        """
        API lấy danh sách lô vắc xin sắp hết hạn.

        Business Rule:
            - Lô active
            - Hạn dùng trong N ngày tới (default: 30)

        Use Case:
            - Nhắc nhập kho
            - Ưu tiên sử dụng lô gần hết hạn
        """

        days = int(request.query_params.get("days") or 30)
        today = timezone.now().date()
        soon = today + timedelta(days=days)
        qs = VaccineStockLot.objects.filter(
            is_active=True, expiry_date__gte=today, expiry_date__lte=soon
        ).select_related("vaccine").order_by("expiry_date", "vaccine__name")
        return Response(StockLotSerializer(qs, many=True).data)

    @action(detail=False, methods=["GET"], url_path="stock-summary")
    def stock_summary(self, request):
        """
        API tổng hợp tồn kho theo vắc xin.

        Business Meaning:
            - Gom nhiều lô thành 1 record theo vaccine
            - Phục vụ dashboard & báo cáo

        Returned Data:
            - tổng số lượng khả dụng
            - lô gần hết hạn nhất
            - danh sách lô chi tiết (rút gọn)

        Notes:
            - Chỉ lấy lô active & còn hàng
        """
        lots = (VaccineStockLot.objects
                .filter(is_active=True, quantity_available__gt=0)
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
            result[vid]["lots"].append({
                "id": lot.id,
                "lot_number": lot.lot_number,
                "expiry_date": lot.expiry_date,
                "quantity_available": lot.quantity_available,
                "location": lot.location
            })
        return Response(list(result.values()))

