# records/migrations/0010_take_over_booking_state.py
from django.db import migrations, models
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('records', '0009_remove_bookingproxy'),
        ('vaccines', '0026_booking_stubs_for_transition'),  # <-- QUAN TRỌNG: đảm bảo stub đã có
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # KHÔNG đụng DB, chỉ chuyển STATE
            state_operations=[
                migrations.CreateModel(
                    name='Booking',
                    fields=[
                        ('id', models.BigAutoField(primary_key=True, serialize=False)),
                        ('appointment_date', models.DateField(blank=True, null=True, verbose_name='Ngày hẹn tiêm')),
                        ('location', models.CharField(max_length=255, blank=True, null=True, verbose_name='Địa điểm tiêm')),
                        ('status', models.CharField(
                            max_length=20,
                            choices=(('pending','Chờ xác nhận'),
                                     ('confirmed','Đã xác nhận'),
                                     ('completed','Đã tiêm xong'),
                                     ('cancelled','Đã hủy')),
                            default='pending',
                            verbose_name='Trạng thái lịch hẹn'
                        )),
                        ('notes', models.TextField(blank=True, null=True, verbose_name='Ghi chú thêm')),
                        ('created_at', models.DateTimeField(auto_now_add=True, null=True, verbose_name='Ngày tạo')),
                        ('member', models.ForeignKey('records.familymember', on_delete=models.CASCADE, verbose_name='Người tiêm')),
                        ('user', models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='Người đặt')),
                        ('vaccine', models.ForeignKey('vaccines.vaccine', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Vắc xin')),
                        ('package', models.ForeignKey('vaccines.vaccinepackage', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Gói tiêm')),
                    ],
                    options={
                        'db_table': 'vaccines_booking',      # GIỮ NGUYÊN BẢNG CŨ
                        'verbose_name': 'Lịch hẹn tiêm',
                        'verbose_name_plural': 'Danh sách lịch hẹn tiêm',
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.CreateModel(
                    name='BookingItem',
                    fields=[
                        ('id', models.BigAutoField(primary_key=True, serialize=False)),
                        ('quantity', models.PositiveIntegerField(default=1, verbose_name='Số liều')),
                        ('unit_price', models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Đơn giá')),
                        ('booking', models.ForeignKey('records.Booking', on_delete=models.CASCADE, related_name='items', verbose_name='Đơn đặt hẹn')),
                        ('vaccine', models.ForeignKey('vaccines.Vaccine', on_delete=models.CASCADE, verbose_name='Vắc xin')),
                    ],
                    options={
                        'db_table': 'vaccines_bookingitem',  # GIỮ NGUYÊN BẢNG CŨ
                        'verbose_name': 'Mục vắc xin',
                        'verbose_name_plural': 'Danh sách mục vắc xin',
                    },
                ),
            ],
        ),
    ]
