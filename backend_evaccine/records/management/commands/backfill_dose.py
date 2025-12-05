from django.core.management.base import BaseCommand
from django.db import transaction
from records.models import VaccinationRecord


class Command(BaseCommand):
    help = "Rebuild dose_number cho các mũi nhập tay (không đi qua booking)"

    @transaction.atomic
    def handle(self, *args, **options):
        # Chỉ đụng vào các mũi nhập tay:
        #   - không có source_booking
        #   - vaccine = None (chỉ có vaccine_name)
        qs = (
            VaccinationRecord.objects
            .filter(source_booking__isnull=True, vaccine__isnull=True)
            .order_by(
                "family_member_id",
                "disease_id",
                "vaccine_name",
                "vaccination_date",
                "id",
            )
        )

        current_key = None
        dose = 0
        updated = 0

        for r in qs:
            # Group ưu tiên theo disease nếu có
            if r.disease_id:
                key = (r.family_member_id, ("disease", r.disease_id))
            else:
                # Nếu không có disease, group theo vaccine_name (chữ thường, bỏ khoảng trắng)
                key = (
                    r.family_member_id,
                    ("vaccine_name", (r.vaccine_name or "").strip().lower()),
                )

            # Nếu sang nhóm mới → reset mũi = 1
            if key != current_key:
                current_key = key
                dose = 1
            else:
                dose += 1

            # Chỉ save khi giá trị thay đổi cho đỡ tốn query
            if r.dose_number != dose:
                r.dose_number = dose
                r.save(update_fields=["dose_number"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Đã cập nhật {updated} record."))
