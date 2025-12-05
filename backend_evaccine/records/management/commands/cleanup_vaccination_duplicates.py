from django.core.management.base import BaseCommand
from records.models import VaccinationRecord

class Command(BaseCommand):
    help = "Xoá các mũi tiêm bị trùng"

    def handle(self, *args, **kwargs):
        qs = VaccinationRecord.objects.filter(
            vaccination_date__isnull=False,
            disease__isnull=False,
        )

        groups = {}
        for r in qs:
            key = (r.family_member_id, r.disease_id, r.vaccination_date)
            groups.setdefault(key, []).append(r)

        removed = 0
        for key, recs in groups.items():
            if len(recs) <= 1:
                continue

            recs.sort(
                key=lambda x: (
                    0 if x.source_booking_id else 1,
                    0 if x.vaccine_id else 1,
                    x.id,
                )
            )

            keep = recs[0]
            to_delete_ids = [r.id for r in recs[1:]]

            VaccinationRecord.objects.filter(id__in=to_delete_ids).delete()
            removed += len(to_delete_ids)

        self.stdout.write(self.style.SUCCESS(f"✔ Đã xoá {removed} mũi tiêm bị trùng"))
