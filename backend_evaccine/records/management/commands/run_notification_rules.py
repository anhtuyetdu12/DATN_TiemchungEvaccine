# records/management/commands/run_notification_rules.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from records.models import NotificationRule
from records.services.auto_notifications import send_auto_notifications

class Command(BaseCommand):
    help = "Chạy các rule nhắc lịch tiêm tự động"

    def handle(self, *args, **options):
        now = timezone.localtime()
        today = now.date()

        rules = NotificationRule.objects.filter(is_active=True)
        for rule in rules:
            # chỉ chạy 1 lần/ngày khi đến đúng giờ
            if rule.last_run_date == today:
                continue
            if now.hour < rule.run_hour or (now.hour == rule.run_hour and now.minute < rule.run_minute):
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

            self.stdout.write(self.style.SUCCESS(
                f"Rule {rule.id} ({rule.name}) sent={result['sent']}"
            ))
