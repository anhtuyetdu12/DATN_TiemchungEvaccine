from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone
from records.models import Booking, VaccinationRecord


class Command(BaseCommand):
    help = "Rebuild missing vaccination records from booking items"

    def handle(self, *args, **options):
        today = timezone.localdate()

        # Chọn các booking muốn khôi phục
        qs = Booking.objects.filter(
            status__in=["pending", "confirmed"],   # cần thì thêm "completed"
            appointment_date__isnull=False,
        )

        created = 0

        for booking in qs:
            member = booking.member
            appt_date = booking.appointment_date

            for item in booking.items.all():
                v = item.vaccine
                if not v:
                    continue

                # Nếu đã có record gắn booking này thì bỏ qua để không tạo trùng
                exists = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    source_booking=booking,
                ).exists()
                if exists:
                    continue

                # Đếm số mũi đã có (đã tiêm hoặc đã có lịch)
                current = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                ).filter(
                    Q(vaccination_date__isnull=False) | Q(next_dose_date__isnull=False)
                ).count()

                VaccinationRecord.objects.create(
                    family_member=member,
                    disease=v.disease,
                    vaccine=v,
                    dose_number=current + 1,
                    vaccination_date=None,
                    next_dose_date=appt_date,
                    note=f"Khôi phục từ booking #{booking.id}",
                    source_booking=booking,
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} records"))
