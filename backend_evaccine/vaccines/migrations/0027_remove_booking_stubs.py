from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('vaccines', '0026_booking_stubs_for_transition'),
        ('inventory', '0002_point_fk_to_records_state'),  # đảm bảo FK đã chuyển xong
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='BookingItem'),
                migrations.DeleteModel(name='Booking'),
            ],
        ),
    ]
