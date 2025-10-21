# records/migrations/0009_remove_bookingproxy.py
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('records', '0008_alter_bookingproxy_options'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='BookingProxy'),
            ],
        ),
    ]
