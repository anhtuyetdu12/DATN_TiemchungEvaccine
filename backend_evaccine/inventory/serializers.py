# inventory/serializers.py
from rest_framework import serializers
from .models import VaccineStockLot, InventoryAlert
from vaccines.serializers import VaccineSerializer

class StockLotSerializer(serializers.ModelSerializer):
    vaccine = VaccineSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = VaccineStockLot
        fields = ["id","vaccine","lot_number","expiry_date","quantity_total","quantity_available","location","is_expired"]

    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.expiry_date < timezone.now().date()

class InventoryAlertSerializer(serializers.ModelSerializer):
    vaccine_name = serializers.CharField(source="vaccine.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = InventoryAlert
        fields = [
            "id","vaccine","vaccine_name","title","message","desired_qty",
            "urgency","status","created_by","created_by_name",
            "created_at","acknowledged_at","processed_by","processed_at"
        ]
        read_only_fields = ["status","created_by","created_at","acknowledged_at","processed_by","processed_at"]
        
        