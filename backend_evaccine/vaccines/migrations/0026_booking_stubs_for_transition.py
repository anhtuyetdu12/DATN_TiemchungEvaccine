from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('vaccines', '0025_move_booking_to_records_state'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # KHÔNG đụng DB
            state_operations=[
                # Stub Booking: để các chỗ còn base vào vaccines.Booking không bị lỗi render
                migrations.CreateModel(
                    name='Booking',
                    fields=[
                        ('id', models.BigAutoField(primary_key=True, serialize=False)),
                    ],
                    options={
                        'db_table': 'vaccines_booking',
                        'managed': False,
                    },
                ),
                # Stub BookingItem: QUAN TRỌNG cho inventory FK cũ
                migrations.CreateModel(
                    name='BookingItem',
                    fields=[
                        ('id', models.BigAutoField(primary_key=True, serialize=False)),
                    ],
                    options={
                        'db_table': 'vaccines_bookingitem',
                        'managed': False,
                    },
                ),
            ],
        ),
    ]
