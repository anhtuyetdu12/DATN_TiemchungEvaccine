from django.core.management.base import BaseCommand
from django.db.models import Q
from records.models import Booking, VaccinationRecord


class Command(BaseCommand):
    help = "Khôi phục các mũi tiêm dự kiến (pending/confirmed) từ Booking vào VaccinationRecord"

    def handle(self, *args, **options):
        STATUSES_TO_RESTORE = ["pending", "confirmed"]

        qs = (
            Booking.objects
            .filter(status__in=STATUSES_TO_RESTORE)
            .select_related("member")
            .prefetch_related("items__vaccine__disease")
        )

        created_count = 0
        skipped_count = 0

        for booking in qs:
            member = booking.member
            if not member:
                continue

            for item in booking.items.all():
                v = item.vaccine
                if not v:
                    continue

                # Nếu đã có record dự kiến cho booking + vaccine này rồi thì bỏ qua
                exists = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    source_booking=booking,
                ).exists()

                if exists:
                    skipped_count += 1
                    continue

                # Đếm số mũi đã tồn tại (đã tiêm hoặc đã có lịch khác)
                current = (
                    VaccinationRecord.objects
                    .filter(family_member=member, vaccine=v)
                    .filter(
                        Q(vaccination_date__isnull=False)
                        | Q(next_dose_date__isnull=False)
                    )
                    .count()
                )

                rec = VaccinationRecord.objects.create(
                    family_member=member,
                    disease=v.disease,           # có thì FE đọc disease.id
                    vaccine=v,
                    dose_number=current + 1,
                    vaccination_date=None,
                    next_dose_date=booking.appointment_date,
                    note=f"Đặt lịch #{booking.id} (khôi phục)",
                    source_booking=booking,
                )

                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[{booking.id}] Created VaccinationRecord id={rec.id} "
                        f"member={member.id}, vaccine={v.id}, next_dose={rec.next_dose_date}"
                    )
                )

        self.stdout.write(
            self.style.WARNING(
                f"Done. Created: {created_count}, skipped: {skipped_count}"
            )
        )
