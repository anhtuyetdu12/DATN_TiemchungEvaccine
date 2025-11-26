# records/management/commands/run_notification_rules.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

from records.models import NotificationRule
from records.services.auto_notifications import send_auto_notifications


DEFAULT_CHANNELS = {"app": True, "email": True}


def ensure_default_rules():
    """
    Tạo sẵn các rule nhắc lịch mặc định nếu chưa có:
    - Upcoming hôm nay (T-0)
    - Upcoming ngày mai (T-1)
    - Upcoming T+3
    - Nextdose (7 ngày tới)
    - Overdue
    """

    # Giờ mặc định chạy (có thể chỉnh trong Admin sau)
    DEFAULT_HOUR = 8
    DEFAULT_MINUTE = 0

    # Danh sách rule mặc định
    defaults = [
        # 1. Lịch tiêm hôm nay (T-0)
        {
            "name": "Nhắc lịch hôm nay (T-0)",
            "audience": "upcoming",
            "days_before": 0,
            "next_dose_days": None,
            "title_tpl": "Nhắc lịch tiêm hôm nay",
            "message_tpl": (
                "Chào {{name}}, hôm nay ({{date}}) {{member}} có lịch tiêm {{vaccine}}. "
                "Vui lòng đến cơ sở tiêm chủng đúng giờ và mang theo giấy tờ cần thiết."
            ),
        },
        # 2. Lịch tiêm ngày mai (T-1)
        {
            "name": "Nhắc lịch ngày mai (T-1)",
            "audience": "upcoming",
            "days_before": 1,
            "next_dose_days": None,
            "title_tpl": "Nhắc lịch tiêm ngày mai",
            "message_tpl": (
                "Chào {{name}}, vào ngày mai ({{date}}) {{member}} có lịch tiêm {{vaccine}}. "
                "Anh/chị vui lòng thu xếp thời gian để đến đúng lịch hẹn."
            ),
        },
        # 3. Lịch tiêm T+3 (đúng ngày hôm nay + 3)
        {
            "name": "Nhắc lịch tiêm T+3",
            "audience": "upcoming",
            "days_before": 3,
            "next_dose_days": None,
            "title_tpl": "Nhắc lịch tiêm trong 3 ngày tới",
            "message_tpl": (
                "Chào {{name}}, trong 3 ngày tới {{member}} sẽ có lịch tiêm {{vaccine}} vào ngày {{date}}. "
                "Quý khách vui lòng ghi nhớ thời gian và chuẩn bị đầy đủ khi đến tiêm."
            ),
        },
        # 4. Mũi tiếp theo (sổ tiêm) – 7 ngày tới
        {
            "name": "Nhắc mũi tiếp theo (7 ngày tới)",
            "audience": "nextdose",
            "days_before": None,
            "next_dose_days": 7,
            "title_tpl": "Nhắc lịch mũi tiêm tiếp theo",
            "message_tpl": (
                "Chào {{name}}, {{member}} đã đến hạn tiêm mũi tiếp theo của vắc xin {{vaccine}} vào ngày {{date}}. "
                "Phác đồ yêu cầu {{total_doses}} mũi, mỗi mũi cách nhau {{interval}} ngày. "
                "Vui lòng thu xếp thời gian để tiêm đúng lịch nhằm đảm bảo hiệu quả phòng bệnh."
            ),
        },
        # 5. Khách trễ hẹn
        {
            "name": "Nhắc khách trễ hẹn",
            "audience": "overdue",
            "days_before": None,
            "next_dose_days": None,
            "title_tpl": "Nhắc lịch tiêm đang trễ",
            "message_tpl": (
                "Chào {{name}}, lịch tiêm của {{member}} vào ngày {{date}} đang bị trễ so với kế hoạch. "
                "Để bảo đảm hiệu quả tiêm chủng, vui lòng sắp xếp đến cơ sở tiêm chủng trong thời gian sớm nhất."
            ),
        },
    ]

    for cfg in defaults:
        rule, created = NotificationRule.objects.get_or_create(
            name=cfg["name"],
            defaults={
                "audience": cfg["audience"],
                "days_before": cfg["days_before"],
                "next_dose_days": cfg["next_dose_days"],
                "title_tpl": cfg["title_tpl"],
                "message_tpl": cfg["message_tpl"],
                "channels": DEFAULT_CHANNELS,
                "run_hour": DEFAULT_HOUR,
                "run_minute": DEFAULT_MINUTE,
                "is_active": True,
            },
        )
        # Nếu đã tồn tại thì không sửa, để bạn chỉnh trong admin nếu muốn
        if created:
            print(f"Created default notification rule: {rule.name}")


class Command(BaseCommand):
    help = "Chạy các rule nhắc lịch tiêm tự động (upcoming T-0/T-1/T-3, nextdose, overdue)"

    def handle(self, *args, **options):
        # Đảm bảo có đủ rule mặc định
        ensure_default_rules()

        now = timezone.localtime()
        today = now.date()

        rules = NotificationRule.objects.filter(is_active=True)

        for rule in rules:
            # chỉ chạy 1 lần/ngày khi đến đúng giờ
            if rule.last_run_date == today:
                continue

            if now.hour < rule.run_hour or (
                now.hour == rule.run_hour and now.minute < rule.run_minute
            ):
                continue

            result = send_auto_notifications(
                audience=rule.audience,
                title_tpl=rule.title_tpl,
                msg_tpl=rule.message_tpl,
                days_before=rule.days_before,
                next_dose_days=rule.next_dose_days,
                only_unscheduled=True,
                distinct_user=False,
                channels=rule.channels,
            )

            rule.last_run_date = today
            rule.save(update_fields=["last_run_date"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Rule {rule.id} ({rule.name}) sent={result['sent']}"
                )
            )
