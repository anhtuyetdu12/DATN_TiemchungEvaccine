# app: records/management/commands/cleanup_planned_records.py
from django.core.management.base import BaseCommand
from django.db.models import Q
from records.models import VaccinationRecord


class Command(BaseCommand):
    help = "Dọn các mũi dự kiến trùng nhau (không xoá mũi đã tiêm)"

    def handle(self, *args, **options):
        # Chỉ đụng vào mũi DỰ KIẾN: chưa tiêm + có ngày hẹn
        qs = (
            VaccinationRecord.objects
            .filter(vaccination_date__isnull=True, next_dose_date__isnull=False)
            .select_related("vaccine")
        )

        groups = {}
        for r in qs:
            disease_id = (
                r.disease_id
                or (r.vaccine.disease_id if r.vaccine_id and r.vaccine else None)
                or 0
            )
            key = (r.family_member_id, disease_id, r.next_dose_date)
            groups.setdefault(key, []).append(r)

        cleared = 0

        for key, recs in groups.items():
            if len(recs) <= 1:
                continue

            # Ưu tiên GIỮ bản có source_booking + vaccine
            recs.sort(
                key=lambda x: (
                    0 if x.source_booking_id else 1,
                    0 if x.vaccine_id else 1,
                    x.id,
                )
            )
            keep = recs[0]
            others = [r.id for r in recs[1:]]

            # KHÔNG XOÁ, chỉ bỏ ngày hẹn & source_booking để không còn là “lịch hẹn”
            VaccinationRecord.objects.filter(id__in=others).update(
                next_dose_date=None,
                source_booking=None,
            )
            cleared += len(others)

        self.stdout.write(
            self.style.SUCCESS(f"Đã dọn {cleared} record dự kiến trùng (không xoá history).")
        )
