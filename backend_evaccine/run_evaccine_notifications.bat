@echo off

REM ép Python dùng UTF-8 cho stdout/stderr
set PYTHONIOENCODING=utf-8

REM đổi code page console sang UTF-8 (cho chắc)
chcp 65001 >nul

REM === 1) Chuyển tới thư mục project ===
cd /d "D:\DoAnTotNghiep\eVaccine\backend_evaccine"

REM === 2) Chạy management command ===
"C:\Users\ASUS\AppData\Local\Programs\Python\Python310\python.exe" manage.py run_notification_rules >> "D:\DoAnTotNghiep\eVaccine\backend_evaccine\logs\evaccine_notifications.log" 2>&1
