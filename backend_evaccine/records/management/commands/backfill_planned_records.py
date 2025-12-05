# app: records/management/commands/backfill_planned_records.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q

from records.models import Booking, VaccinationRecord
from records.views import create_planned_records_for_booking


class Command(BaseCommand):
    help = "Sinh VaccinationRecord dự kiến cho các lịch hẹn chưa bị huỷ / chưa hoàn thành"

    def handle(self, *args, **options):
        today = timezone.now().date()

        qs = (
            Booking.objects
            .exclude(status__in=["cancelled", "completed"])
            .select_related("member")
            .prefetch_related("items__vaccine__disease")
        )

        count = 0

        for b in qs:
            if not b.member:
                continue

            # Lấy danh sách vaccine & disease trong booking này
            vaccines = [it.vaccine for it in b.items.all() if it.vaccine_id]
            vaccine_ids = [v.id for v in vaccines]
            disease_ids = [
                v.disease_id for v in vaccines
                if getattr(v, "disease_id", None)
            ]

            # Kiểm tra xem đã có MŨI DỰ KIẾN nào cho CHÍNH bệnh/vaccine này chưa
            has_planned = VaccinationRecord.objects.filter(
                family_member=b.member,
                vaccination_date__isnull=True,
                next_dose_date=b.appointment_date,
            ).filter(
                Q(vaccine_id__in=vaccine_ids) |
                Q(disease_id__in=disease_ids)
            ).exists()

            if has_planned:
                continue

            self.stdout.write(
                f"Backfill booking #{b.id} ({b.appointment_date})"
            )
            create_planned_records_for_booking(b)
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Đã backfill xong {count} booking."))
