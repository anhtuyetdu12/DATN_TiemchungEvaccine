# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, MedicalStaff
import logging
from .serializers import LoginSerializer, StaffLoginSerializer
from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from rest_framework.permissions import IsAdminUser
from django.db import IntegrityError
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .models import CustomUser
import random, datetime, string


logger = logging.getLogger(__name__)

class RegisterAPIView(APIView):
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


# --- Quên mật khẩu ---
class ForgotPasswordAPIView(APIView):
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
            token.set_exp(lifetime=1800)  # 30 phút
            reset_link = f"{settings.FRONTEND_URL}/reset-password?identifier={identifier}&token={str(token)}"

            # Gửi email
            subject = "Đặt lại mật khẩu"
            message = (
                f"Xin chào {user.full_name},\n\n"
                f"Bạn vừa yêu cầu đặt lại mật khẩu. Bấm link sau để đặt lại mật khẩu (hạn 30 phút):\n{reset_link}"
            )
            send_mail(subject, message, settings.EMAIL_HOST_USER, [identifier], fail_silently=False)

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
    
        
# views.py
class ResetPasswordAPIView(APIView):
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
                return Response({"detail": "Thiếu token xác thực"}, status=400)
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                user = CustomUser.objects.get(id=user_id, email=identifier)
            except Exception:
                return Response({"detail": "Token không hợp lệ hoặc đã hết hạn"}, status=400)
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
        


# class ResetPasswordByPhoneAPIView(APIView):
#     def post(self, request):
#         phone = request.data.get("phone")
#         password = request.data.get("password")
#         repassword = request.data.get("repassword")

#         if not phone or not password or not repassword:
#             return Response({"detail": "Thiếu trường bắt buộc"}, status=400)
#         if password != repassword:
#             return Response({"detail": "Mật khẩu nhập lại không khớp"}, status=400)

#         try:
#             user = CustomUser.objects.get(phone=phone)
#         except CustomUser.DoesNotExist:
#             return Response({"detail": "Số điện thoại không tồn tại"}, status=400)

#         user.set_password(password)
#         user.must_change_password = False
#         user.save()

#         return Response({"detail": "Đặt lại mật khẩu thành công"}, status=200)


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