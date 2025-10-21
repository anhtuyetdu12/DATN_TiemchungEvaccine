# inventory/migrations/0002_point_fk_to_records_state.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
        ('records', '0010_take_over_booking_state'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='bookingallocation',
                    name='booking_item',
                    field=models.ForeignKey(
                        to='records.BookingItem',
                        on_delete=models.CASCADE,
                        related_name='allocations',
                    ),
                ),
            ],
        ),
    ]
