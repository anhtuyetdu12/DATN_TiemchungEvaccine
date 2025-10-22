# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, MedicalStaff
import logging
from .serializers import LoginSerializer, StaffLoginSerializer
from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from rest_framework.permissions import IsAdminUser, AllowAny  , IsAuthenticated
from django.db import IntegrityError
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
import random, datetime, string
from datetime import timedelta
from django.core.mail import EmailMultiAlternatives
from email.mime.image import MIMEImage
from rest_framework import status
from .serializers import StaffCreateCustomerSerializer

logger = logging.getLogger(__name__)

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get("identifier")
        full_name = request.data.get("full_name")
        password = request.data.get("password")
        repassword = request.data.get("repassword")

         # Kiểm tra trường bắt buộc
        if not identifier or not password or not repassword or not full_name:
            return Response({"detail": "Vui lòng điền đầy đủ thông tin"}, status=status.HTTP_400_BAD_REQUEST)
        
        if password != repassword:
            return Response({"detail": "Mật khẩu nhập lại không khớp"}, status=400)

        if "@" in identifier:
            email = identifier
            phone = ""
        else:
            email = f"user{identifier}@gmail.com"
            phone = identifier

        # Kiểm tra tồn tại
        if CustomUser.objects.filter(email=email).exists():
            return Response({"identifier": "Email đã tồn tại"}, status=400)
        if phone and CustomUser.objects.filter(phone=phone).exists():
            return Response({"identifier": "Số điện thoại đã tồn tại"}, status=400)

        try:
            user = CustomUser.objects.create_user(
                email=email,
                full_name=full_name,
                password=password,
                phone=phone,
                role="customer"
            )
            return Response({"message": "Đăng ký tài khoản thành công!!!"}, status=201)
        except IntegrityError as e:
            return Response({"detail": "Email hoặc số điện thoại đã tồn tại"}, status=400)
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return Response({"detail": "Đã xảy ra lỗi trên máy chủ"}, status=500)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            remember = serializer.validated_data['remember']

            refresh = RefreshToken.for_user(user)
            if remember:
                refresh.set_exp(lifetime=datetime.timedelta(days=30))

            # Nếu user phải đổi pass (ví dụ sau khi nhận temp password)
            if user.must_change_password:
                return Response({
                    "require_change_password": True,
                    "message": "Bạn cần đổi mật khẩu trước khi tiếp tục",
                    "user_id": user.id
                }, status=status.HTTP_200_OK)

            return Response({
                "message": "Đăng nhập thành công",
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "is_staff": user.is_staff,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
class LogoutAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Thiếu refresh token"}, status=400)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
            return Response(status=205)
        except Exception:
            return Response({"detail": "Token không hợp lệ"}, status=400)

# --- Quên mật khẩu ---
class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get("identifier")
        if not identifier:
            return Response({"detail": "Phải nhập email hoặc số điện thoại"}, status=400)

        # --- Email ---
        if "@" in identifier:
            try:
                user = CustomUser.objects.get(email=identifier)
            except CustomUser.DoesNotExist:
                return Response({"detail": "Email không tồn tại"}, status=400)

            # Token 30 phút
            token = RefreshToken.for_user(user).access_token
            token.set_exp(lifetime=timedelta(minutes=15))  # 15 phút
            reset_link = f"{settings.FRONTEND_URL}/reset-password?identifier={identifier}&token={str(token)}"

            # Gửi email
            subject = "Đặt lại mật khẩu"
            text_content = (
                f"Xin chào {user.full_name},\n\n"
                f"Bạn vừa yêu cầu đặt lại mật khẩu. Bấm link sau để đặt lại mật khẩu (hạn 15 phút):\n{reset_link}"
            )
            # send_mail(subject, message, settings.EMAIL_HOST_USER, [identifier], fail_silently=False)
            html_content = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: Arial, sans-serif; background:#CDE4FC; padding:20px;">
                    <div style="max-width:600px;margin:auto;background:#ffffff;padding:0;border-radius:8px;overflow:hidden;">                        
                        <!-- Background với chữ -->
                        <table width="600" cellspacing="0" cellpadding="0" 
                                style="background-image:url('cid:banner'); background-size:cover; background-position:center; text-align:center; height:280px;">
                            <tr>
                                <td>
                                    <!-- Bảng trong: overlay màu đen mờ -->
                                    <table width="600" cellspacing="0" cellpadding="0" style="background-color:rgba(0,0,0,0.5); height:280px;"> 
                                        <tr>
                                            <td style="padding-top:40px; text-align:center;">
                                                <img src="cid:logo" alt="Logo" width="100" height="100" style="border-radius:50%;border:3px solid #fff;">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:2px 0;">
                                                <div style=" display:block; width:90%; margin:0 auto; padding:10px 0; font-size:22px; font-weight:bold; color:white;
                                                        background:linear-gradient(90deg,#1c29f1 0%,#ed0f57 50%,#1c29f1 100%); text-align:center;">
                                                    TIÊM CHỦNG EVACCINE &#128137;`
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <div style="padding:13px;">
                            <h2 style="color:#2563eb; text-align:center;">Xin chào {user.full_name}</h2>
                            <p style="font-size:16px;color:#374151;">
                                Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản. Nhấn nút bên dưới để đặt lại mật khẩu (hạn 15 phút):
                            </p>
                            <div style="text-align:center;margin:23px 0;">
                                <a href="{reset_link}"
                                style="background:linear-gradient(90deg, #100ce3, #4afbfe);
                                        color:white;padding:12px 24px;text-decoration:none;
                                        border-radius:6px;display:inline-block;font-size:16px;">
                                Đặt lại mật khẩu
                                </a>
                            </div>
                            <p style="font-size:14px;color:#6b7280;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                            <p>Trân trọng,<br>Trung tâm tiêm chủng - Evaccine</p>
                        </div>
                    </div>
                    <div style="text-align:center;margin-top:20px;font-size:12px;color:#6b7280;">
                        © 2025 Tiem Chung Evaccine. All rights reserved.
                    </div>
                </body>
                </html>
                """

            email = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [identifier])
            email.attach_alternative(html_content, "text/html")
            
            with open("static/images/bg1.jpg", "rb") as f:
                img = MIMEImage(f.read())
                img.add_header('Content-ID', '<banner>')
                email.attach(img)
            
            with open("static/images/logo.jpg","rb") as f:
                img_logo = MIMEImage(f.read())
                img_logo.add_header('Content-ID','<logo>')
                email.attach(img_logo)           
                
            email.send()

            return Response({"detail": "Đã gửi email đặt lại mật khẩu"}, status=200)

        # --- Phone ---
        else:
            try:
                user = CustomUser.objects.get(phone=identifier)
            except CustomUser.DoesNotExist:
                return Response({"detail": "Số điện thoại không tồn tại"}, status=400)

            # sinh mật khẩu tạm
            
            temp_password = ''.join(random.choice(string.ascii_letters + string.digits + "!@#$%^&*") for _ in range(8))
            user.set_password(temp_password)
            user.must_change_password = True
            user.save()
            
             # Có thể gửi mật khẩu tạm qua SMS, ở đây trả về response cho dễ test
            return Response({
                "detail": "Đã tạo mật khẩu tạm, vui lòng đăng nhập và đổi mật khẩu",
                "temp_password": temp_password
            }, status=200)
    
        
# đặt lại pass
class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get("identifier")
        password = request.data.get("password")
        repassword = request.data.get("repassword")
        token = request.data.get("token")  # chỉ bắt buộc cho email

        if not identifier or not password or not repassword:
            return Response({"detail": "Thiếu trường bắt buộc"}, status=400)
        if password != repassword:
            return Response({"detail": "Mật khẩu nhập lại không khớp"}, status=400)

        # Email: verify token
        if "@" in identifier:
            if not token:
                return Response({"detail": "Thiếu mã xác thực trong email. Vui lòng mở email đặt lại mật khẩu để lấy mã."}, status=400)
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                user = CustomUser.objects.get(id=user_id, email=identifier)
            except Exception:
                return Response({"detail": "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."}, status=400)
        # Phone: không cần token
        else:
            try:
                user = CustomUser.objects.get(phone=identifier)
            except CustomUser.DoesNotExist:
                return Response({"detail": "Số điện thoại không tồn tại"}, status=400)

        # Đổi mật khẩu
        user.set_password(password)
        user.must_change_password = False
        user.save()

        return Response({"detail": "Đặt lại mật khẩu thành công"}, status=200)
        

class CreateStaffAPIView(APIView):
    permission_classes = [IsAdminUser]  # chỉ admin mới gọi được

    def post(self, request):
        email = request.data.get("email")
        full_name = request.data.get("full_name")
        password = request.data.get("password")
        department = request.data.get("department")
        specialization = request.data.get("specialization")
        license_number = request.data.get("license_number")
        work_shift = request.data.get("work_shift")

        if not email or not full_name or not password:
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.create_user(
                email=email,
                full_name=full_name,
                password=password,
                role="staff",
                is_staff=True
            )

            staff = MedicalStaff.objects.create(
                user=user,
                department=department,
                specialization=specialization,
                license_number=license_number,
                work_shift=work_shift
            )

            return Response({"message": "Staff created successfully"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating staff: {e}")
            return Response({"error": "Server error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
class StaffLoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = StaffLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Đăng nhập thành công",
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "role": user.role
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
# tạo tài khoản mới do staff
class StaffCreateCustomerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = getattr(request.user, "role", "")
        if role not in ("staff", "admin", "superadmin"):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        ser = StaffCreateCustomerSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        user = result["user"]

        member_self = None
        try:
            from records.models import FamilyMember
            member_self = FamilyMember.objects.filter(user=user, relation="Bản thân").first()
        except Exception:
            pass

        return Response({
            "message": "Đã tạo tài khoản cho khách hàng. Khách có thể đăng nhập ngay bằng tài khoản vừa tạo.",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "must_change_password": user.must_change_password,  # False
                "code": f"KH-{user.id:04d}",
                # BỔ SUNG 2 TRƯỜNG NÀY
                "gender": getattr(user, "gender", None) or getattr(member_self, "gender", None),
                "date_of_birth": getattr(user, "date_of_birth", None) or getattr(member_self, "date_of_birth", None),
            }
        }, status=status.HTTP_201_CREATED)
        
