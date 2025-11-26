from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from records.models import Booking, VaccinationRecord, CustomerNotification
from records.views import render_msg, send_notification_email


def send_auto_notifications(
    *,
    audience: str,
    title_tpl: str,
    msg_tpl: str,
    days_before: int | None = None,
    next_dose_days: int | None = None,
    only_unscheduled: bool = True,
    distinct_user: bool = False,
    channels: dict | None = None,
) -> dict:
    """
    Hàm dùng chung cho CRON / management command.
    Trả về: {"sent": n, "recipients": [user_id,...]}

    Ở đây đã bổ sung:
    - meta["vaccine_details"] cho các audience: upcoming, overdue, nextdose
    để FE hiển thị block "Chi tiết mũi tiêm".
    """
    channels = channels or {}
    today = timezone.now().date()
    recipients: set[int] = set()

    # ===== 1) AUDIENCE THEO BOOKING: upcoming / overdue =====
    if audience in ("upcoming", "overdue"):
        if audience == "upcoming":
            try:
                n = int(days_before or 0)
            except Exception:
                n = 0

            target_date = today + timedelta(days=n)

            bks = (
                Booking.objects.filter(
                    appointment_date=target_date,
                    status__in=["pending", "confirmed"],
                )
                .select_related("user", "member")
                .prefetch_related("items__vaccine__disease")
            )
        else:  # overdue
            bks = (
                Booking.objects.filter(appointment_date__lt=today)
                .exclude(status__in=["completed", "cancelled"])
                .select_related("user", "member")
                .prefetch_related("items__vaccine__disease")
            )

        recipients = {b.user_id for b in bks if b.user_id}
        created = 0

        with transaction.atomic():
            for b in bks:
                if not b.user:
                    continue

                member_name = b.member.full_name if b.member else ""
                appt_date = b.appointment_date

                # --- Lấy các record "dự kiến" để suy ra mũi số mấy ---
                planned = (
                    VaccinationRecord.objects.filter(
                        family_member=b.member,
                        next_dose_date=appt_date,
                    )
                    .select_related("vaccine", "disease")
                )
                planned_index: dict = {}
                for p in planned:
                    key = p.vaccine_id or p.vaccine_name
                    planned_index[key] = p.dose_number

                vaccine_details: list[dict] = []
                vaccine_names: list[str] = []
                disease_names: list[str] = []
                total_price = 0

                # --- Duyệt các item trong booking ---
                for it in b.items.all():
                    if not it.vaccine:
                        continue
                    v = it.vaccine
                    key = v.id
                    # đơn giá
                    try:
                        unit_price = int(float(it.unit_price or 0))
                    except Exception:
                        unit_price = 0
                    qty = int(it.quantity or 1)
                    line_price = unit_price * qty
                    total_price += line_price

                    vaccine_details.append(
                        {
                            "vaccine_name": v.name,
                            "disease_name": v.disease.name if v.disease else "",
                            "quantity": qty,
                            "unit_price": unit_price,
                            "dose_number": planned_index.get(key),
                        }
                    )

                    vaccine_names.append(v.name)
                    if v.disease:
                        disease_names.append(v.disease.name)

                # --- Trường hợp booking không có items, chỉ vaccine/package ---
                if not vaccine_details:
                    if b.vaccine:
                        v = b.vaccine
                        key = v.id
                        dose_no = planned_index.get(key)
                        unit_price = int(getattr(v, "price", 0) or 0)
                        total_price += unit_price
                        vaccine_details.append(
                            {
                                "vaccine_name": v.name,
                                "disease_name": v.disease.name if v.disease else "",
                                "quantity": 1,
                                "unit_price": unit_price,
                                "dose_number": dose_no,
                            }
                        )
                        vaccine_names.append(v.name)
                        if v.disease:
                            disease_names.append(v.disease.name)
                    elif b.package:
                        unit_price = int(getattr(b.package, "price", 0) or 0)
                        total_price += unit_price
                        vaccine_details.append(
                            {
                                "vaccine_name": f"Gói: {b.package.name}",
                                "disease_name": "",
                                "quantity": 1,
                                "unit_price": unit_price,
                                "dose_number": None,
                            }
                        )
                        vaccine_names.append(f"Gói: {b.package.name}")

                # --- Context để render template ---
                ctx = {
                    "name": b.user.full_name or b.user.email,
                    "member": member_name,
                    "date": appt_date.isoformat() if appt_date else "",
                    "vaccine": ", ".join(dict.fromkeys(vaccine_names)),
                    "disease": ", ".join(dict.fromkeys(disease_names)),
                    "price": total_price,
                    "location": b.location or "",
                    "interval": "",
                    "total_doses": "",
                    "dob": (
                        b.member.date_of_birth.isoformat()
                        if getattr(b.member, "date_of_birth", None)
                        else ""
                    ),
                }

                rendered_title = render_msg(title_tpl, ctx)
                rendered_msg = render_msg(msg_tpl, ctx)

                CustomerNotification.objects.create(
                    user_id=b.user_id,
                    title=rendered_title,
                    message=rendered_msg,
                    channels=channels,
                    audience=audience,
                    meta={
                        "booking_id": b.id,
                        "member_name": member_name,
                        "appointment_date": (
                            appt_date.isoformat() if appt_date else None
                        ),
                        "location": b.location or "",
                        "status": b.status,
                        "vaccine_details": vaccine_details,  # 👈 FE dùng để "Xem chi tiết"
                        "vaccines": list(dict.fromkeys(vaccine_names)),
                        "diseases": list(dict.fromkeys(disease_names)),
                        "price": total_price,
                    },
                )
                created += 1

                # Gửi email nếu bật kênh email
                if channels.get("email") and b.user.email:
                    send_notification_email(
                        to_email=b.user.email,
                        subject=rendered_title,
                        body=rendered_msg,
                    )

        return {"sent": created, "recipients": list(recipients)}

    # ===== 2) AUDIENCE THEO RECORD: nextdose =====
    if audience == "nextdose":
        try:
            n = int(next_dose_days or 3)
        except Exception:
            n = 3
        to = today + timedelta(days=n)

        recs = (
            VaccinationRecord.objects.filter(
                next_dose_date__gte=today,
                next_dose_date__lte=to,
            )
            .select_related("family_member__user", "vaccine", "disease")
        )

        bookings_by_key = {}
        if only_unscheduled:
            member_ids = [r.family_member_id for r in recs if r.family_member_id]
            if member_ids:
                bks = (
                    Booking.objects.filter(
                        member_id__in=member_ids,
                        appointment_date__gte=today,
                        appointment_date__lte=to,
                    )
                    .exclude(status__in=["cancelled"])
                    .select_related("member", "user")
                    .prefetch_related("items__vaccine")
                )
                for b in bks:
                    if b.items.exists():
                        for it in b.items.all():
                            bookings_by_key[
                                (b.member_id, b.appointment_date, it.vaccine_id)
                            ] = True
                    else:
                        bookings_by_key[
                            (b.member_id, b.appointment_date, b.vaccine_id)
                        ] = True

        created = 0
        with transaction.atomic():
            for r in recs:
                fm = r.family_member
                usr = fm.user if fm else None
                if not usr:
                    continue

                if only_unscheduled:
                    v = r.vaccine
                    key = (
                        fm.id if fm else None,
                        r.next_dose_date,
                        v.id if v else None,
                    )
                    if bookings_by_key.get(key):
                        continue

                vaccine_name = (
                    r.vaccine.name if r.vaccine else (r.vaccine_name or "")
                )
                disease_name = (
                    r.disease.name
                    if r.disease
                    else (
                        r.vaccine.disease.name
                        if r.vaccine and r.vaccine.disease
                        else ""
                    )
                )
                price_val = int(getattr(r.vaccine, "price", 0) or 0)
                interval = getattr(r.vaccine, "interval_days", None)
                total_doses = getattr(r.vaccine, "doses_required", None)
                dob = (
                    fm.date_of_birth.isoformat()
                    if fm and fm.date_of_birth
                    else ""
                )

                ctx = {
                    "name": usr.full_name or usr.email,
                    "member": fm.full_name if fm else "",
                    "date": (
                        r.next_dose_date.isoformat()
                        if r.next_dose_date
                        else ""
                    ),
                    "vaccine": vaccine_name,
                    "disease": disease_name,
                    "price": price_val,
                    "location": "",
                    "interval": interval or "",
                    "total_doses": total_doses or "",
                    "dob": dob,
                }

                rendered_title = render_msg(title_tpl, ctx)
                rendered_msg = render_msg(msg_tpl, ctx)

                CustomerNotification.objects.create(
                    user_id=usr.id,
                    title=rendered_title,
                    message=rendered_msg,
                    channels=channels,
                    audience=audience,
                    meta={
                        "record_id": r.id,
                        "member_name": fm.full_name if fm else "",
                        "appointment_date": (
                            r.next_dose_date.isoformat()
                            if r.next_dose_date
                            else None
                        ),
                        "location": "",
                        "status": "nextdose",
                        "dose_number": r.dose_number,
                        "vaccines": [vaccine_name] if vaccine_name else [],
                        "diseases": [disease_name] if disease_name else [],
                        "price": price_val,
                        "vaccine_details": [  # 👈 FE dùng để render chi tiết
                            {
                                "vaccine_name": vaccine_name,
                                "disease_name": disease_name,
                                "quantity": 1,
                                "unit_price": price_val,
                                "dose_number": r.dose_number,
                            }
                        ],
                    },
                )
                recipients.add(usr.id)
                created += 1

                if channels.get("email") and usr and usr.email:
                    send_notification_email(
                        to_email=usr.email,
                        subject=rendered_title,
                        body=rendered_msg,
                    )

        return {"sent": created, "recipients": list(recipients)}

    # các audience khác chưa hỗ trợ
    return {"sent": 0, "recipients": []}
