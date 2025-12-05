# records/management/commands/restore_vaccinations.py

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.db.models import Q

from records.models import Booking, VaccinationRecord
from inventory.models import BookingAllocation


def _out(stdout, msg):
    if stdout:
        stdout.write(msg)
    else:
        print(msg)


def restore_completed_from_bookings(dry_run=True, stdout=None):
    """
    Khôi phục các mũi ĐÃ TIÊM (vaccination_date != NULL)
    dựa trên Booking(status=completed) + BookingAllocation(status=consumed).
    """
    today = timezone.localdate()
    total_created = 0

    with transaction.atomic():
        bookings = (
            Booking.objects
            .filter(status="completed")
            .select_related("member")
            .prefetch_related("items__vaccine", "items__allocations__lot")
        )

        for b in bookings:
            member = b.member
            if not member:
                continue

            _out(stdout, f"\n>>> Booking #{b.id} - member={member.id}")

            for item in b.items.all():
                v = item.vaccine
                if not v:
                    continue

                # các allocation đã dùng
                allocs = list(
                    item.allocations
                    .filter(status="consumed")
                    .select_related("lot")
                    .order_by("id")
                )
                if not allocs:
                    _out(stdout, f"  - Vaccine {v.id} {v.name}: không có allocation consumed, bỏ qua")
                    continue

                # record đã tiêm hiện có cho booking này
                existing_qs = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    source_booking=b,
                    vaccination_date__isnull=False,
                ).order_by("dose_number")

                existing_count = existing_qs.count()
                needed = len(allocs) - existing_count

                _out(
                    stdout,
                    f"  - Vaccine {v.id} {v.name}: allocs={len(allocs)}, "
                    f"records_đã_có={existing_count}, thiếu={needed}"
                )

                if needed <= 0:
                    continue

                # ngày tiêm: lấy ngày hẹn nếu có, không thì hôm nay
                vacc_date = b.appointment_date or today

                # số mũi đã tiêm TRƯỚC ngày này
                taken_before = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    vaccination_date__lt=vacc_date,
                ).count()

                next_dose_number = taken_before + existing_count + 1

                # bỏ qua các alloc đã "được map" với record tồn tại
                used_allocs = allocs[existing_count : existing_count + needed]

                for alloc in used_allocs:
                    lot = alloc.lot
                    lot_number = getattr(lot, "lot_number", "") if lot else ""

                    _out(
                        stdout,
                        f"    -> sẽ tạo dose {next_dose_number} ngày {vacc_date}, lot={lot_number}"
                    )

                    if not dry_run:
                        VaccinationRecord.objects.create(
                            family_member=member,
                            disease=v.disease,
                            vaccine=v,
                            dose_number=next_dose_number,
                            vaccination_date=vacc_date,
                            next_dose_date=None,
                            vaccine_lot=lot_number,
                            note=f"Khôi phục từ booking #{b.id}",
                            source_booking=b,
                        )
                        total_created += 1

                    next_dose_number += 1

    return total_created


def restore_planned_from_bookings(dry_run=True, stdout=None):
    """
    Khôi phục các mũi DỰ KIẾN (chờ tiêm / trễ hẹn)
    dựa trên Booking (pending/confirmed/overdue).
    """
    today = timezone.localdate()
    total_created = 0

    with transaction.atomic():
        bookings = (
            Booking.objects
            .exclude(status__in=["cancelled"])
            .filter(appointment_date__isnull=False)
            .select_related("member")
            .prefetch_related("items__vaccine")
        )

        for b in bookings:
            member = b.member
            if not member:
                continue

            _out(stdout, f"\n>>> Check planned for booking #{b.id} - member={member.id}")

            for item in b.items.all():
                v = item.vaccine
                if not v:
                    continue

                # nếu booking đã completed và đã có mũi đã tiêm từ booking này
                if b.status == "completed" and VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    source_booking=b,
                    vaccination_date__isnull=False,
                ).exists():
                    # không cần mũi dự kiến nữa
                    continue

                # đã có record dự kiến đúng ngày hẹn chưa?
                planned_qs = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    source_booking=b,
                    vaccination_date__isnull=True,
                    next_dose_date=b.appointment_date,
                )
                if planned_qs.exists():
                    continue  # chưa bị xóa

                # tính dose_number
                taken_before = VaccinationRecord.objects.filter(
                    family_member=member,
                    vaccine=v,
                    vaccination_date__lt=b.appointment_date,
                ).count()

                dose_number = taken_before + 1

                _out(
                    stdout,
                    f"    -> sẽ tạo mũi DỰ KIẾN dose={dose_number} ngày={b.appointment_date} "
                    f"cho vaccine {v.id} {v.name}"
                )

                if not dry_run:
                    VaccinationRecord.objects.create(
                        family_member=member,
                        disease=v.disease,
                        vaccine=v,
                        dose_number=dose_number,
                        vaccination_date=None,
                        next_dose_date=b.appointment_date,
                        note=f"Tự sinh mũi từ booking #{b.id} (khôi phục)",
                        source_booking=b,
                    )
                    total_created += 1

    return total_created


class Command(BaseCommand):
    help = "Khôi phục các mũi tiêm (đã tiêm + dự kiến) bị xóa nhầm từ booking."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ in log, không ghi vào database",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        self.stdout.write(self.style.WARNING(
            f"=== RESTORE VACCINATIONS (dry_run={dry_run}) ==="
        ))

        created_completed = restore_completed_from_bookings(dry_run=dry_run, stdout=self.stdout)
        created_planned = restore_planned_from_bookings(dry_run=dry_run, stdout=self.stdout)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Hoàn tất. Đã chuẩn bị tạo "
            f"{created_completed} mũi 'ĐÃ TIÊM' + {created_planned} mũi 'CHỜ TIÊM/TRỄ HẸN'."
        ))
        if dry_run:
            self.stdout.write(self.style.WARNING(
                "Bạn đang chạy dry-run, chưa ghi gì vào DB.\n"
                "Nếu log OK, hãy chạy lại không kèm --dry-run để áp dụng thật."
            ))
