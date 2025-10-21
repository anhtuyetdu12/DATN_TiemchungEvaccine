# vaccines/migrations/0025_move_booking_to_records_state.py
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('vaccines', '0024_vaccine_low_stock_threshold'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # DB không đổi
            state_operations=[        # TẠM THỜI KHÔNG XÓA GÌ Ở STATE
            ],
        ),
    ]
