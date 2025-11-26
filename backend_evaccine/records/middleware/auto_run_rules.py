from django.utils import timezone
from django.conf import settings   # <- thêm dòng này
from records.models import NotificationRule
from records.services.auto_notifications import send_auto_notifications


def auto_run_daily_rules(get_response):
    def middleware(request):
        # Trong môi trường DEBUG (dev), bỏ qua luôn middleware cho đỡ nặng
        if settings.DEBUG:
            return get_response(request)

        now = timezone.localtime()
        today = now.date()

        rules = NotificationRule.objects.filter(is_active=True)
        for rule in rules:
            # Chỉ chạy 1 lần/ngày
            if rule.last_run_date == today:
                continue

            # Nếu chưa đến giờ chạy -> bỏ qua
            if now.hour < rule.run_hour or (now.hour == rule.run_hour and now.minute < rule.run_minute):
                continue

            # Chạy rule
            send_auto_notifications(
                audience=rule.audience,
                title_tpl=rule.title_tpl,
                msg_tpl=rule.message_tpl,
                days_before=rule.days_before,
                next_dose_days=rule.next_dose_days,
                channels=rule.channels,
            )

            rule.last_run_date = today
            rule.save(update_fields=["last_run_date"])

        return get_response(request)

    return middleware
