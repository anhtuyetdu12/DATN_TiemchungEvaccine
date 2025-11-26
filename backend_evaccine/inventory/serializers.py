# inventory/serializers.py
from rest_framework import serializers
from .models import VaccineStockLot
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

        