# inventory/serializers.py
from rest_framework import serializers
from .models import VaccineStockLot
from vaccines.serializers import VaccineSerializer

class StockLotSerializer(serializers.ModelSerializer):
    """
    StockLotSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize dữ liệu lô tồn kho vắc xin.

    Business Meaning:
        FE dùng để:
            - xem danh sách lô
            - kiểm tra hạn dùng
            - theo dõi tồn kho theo từng lô

    Notes:
        - is_expired là field computed, không lưu DB
        - vaccine chỉ đọc (read-only)
    """
    vaccine = VaccineSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = VaccineStockLot
        fields = ["id","vaccine","lot_number","expiry_date","quantity_total","quantity_available","location","is_expired"]
        
    def get_is_expired(self, obj):
        """
        Trả về trạng thái hết hạn của lô vắc xin.
        """
        from django.utils import timezone
        return obj.expiry_date < timezone.now().date()

        