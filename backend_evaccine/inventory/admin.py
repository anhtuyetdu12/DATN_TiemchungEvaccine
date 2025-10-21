# inventory/admin.py
from django.contrib import admin
from .models import VaccineStockLot, BookingAllocation

@admin.register(VaccineStockLot)
class VaccineStockLotAdmin(admin.ModelAdmin):
    list_display = ("vaccine", "lot_number", "expiry_date", "quantity_available", "is_active", "location")
    list_filter = ("is_active", "expiry_date", "vaccine")
    search_fields = ("lot_number", "vaccine__name")

@admin.register(BookingAllocation)
class BookingAllocationAdmin(admin.ModelAdmin):
    list_display = ("booking_item", "lot", "quantity", "status", "reserved_at")
    list_filter = ("status", "lot__vaccine")
