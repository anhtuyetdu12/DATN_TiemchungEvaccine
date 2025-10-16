from rest_framework import serializers
from .models import CustomUser
import re
from django.contrib.auth.hashers import make_password
from rest_framework import generics
from .models import CustomUser, MedicalStaff
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

class RegisterSerializer(serializers.ModelSerializer):
    repassword = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['full_name', 'email', 'phone', 'password', 'repassword']

    def validate_full_name(self, value):
        # dùng str.isalpha() + isspace() để chấp nhận dấu tiếng Việt
        if not all(c.isalpha() or c.isspace() for c in value):
            raise serializers.ValidationError("Họ và tên chỉ được chứa chữ cái và khoảng trắng")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Họ và tên phải có ít nhất 5 ký tự")
        return value
    
    def validate_phone(self, value):
        if not re.fullmatch(r'\d{10}', value):
            raise serializers.ValidationError("Số điện thoại phải gồm đúng 10 chữ số")
        return value
    
    def validate_email(self, value):
        if not (value.endswith("@gmail.com") or value.endswith("@evaccine.com")):
            raise serializers.ValidationError("Email phải có đuôi @gmail.com (user) hoặc @evaccine.com (staff)")
        if " " in value:
            raise serializers.ValidationError("Email không được chứa khoảng trắng")
        return value

    def validate_password(self, value):
        if " " in value:
            raise serializers.ValidationError("Mật khẩu không được chứa khoảng trắng")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 chữ hoa")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 chữ thường")
        if not re.search(r'[\W_]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt")
        if len(value) < 6:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự")
        return value

    def validate(self, data):
        if data['password'] != data.pop('repassword'):
            raise serializers.ValidationError({"repassword": "Mật khẩu nhập lại không khớp"})
        return data

    def create(self, validated_data):
        validated_data["role"] = "customer"   # Chỉ user thường được đăng ký
        validated_data['password'] = make_password(validated_data['password'])
        return CustomUser.objects.create(**validated_data)
    
    
class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)
    remember = serializers.BooleanField(default=False)

    def validate_identifier(self, value):
        if "@" in value:
            # Email login
            if not (value.endswith("@gmail.com") or value.endswith("@evaccine.com")):
                raise serializers.ValidationError("Email phải có đuôi @gmail.com hoặc @evaccine.com")
            if " " in value:
                raise serializers.ValidationError("Email không được chứa khoảng trắng")
        else:
            # Phone login (chỉ cho user)
            if not re.fullmatch(r'\d{10}', value):
                raise serializers.ValidationError("Số điện thoại phải gồm đúng 10 chữ số")
        return value

    def validate_password(self, value):
        if " " in value:
            raise serializers.ValidationError("Mật khẩu không được chứa khoảng trắng")
        if value == "":
            raise serializers.ValidationError("Mật khẩu không được để trống")
        return value

    def validate(self, data):
        identifier = data.get('identifier')
        password = data.get('password')

        # --- Lấy user ---
        if "@" in identifier:
            user = CustomUser.objects.filter(email=identifier).first()
        else:
            user = CustomUser.objects.filter(phone=identifier).first()

        if not user:
            raise serializers.ValidationError({"identifier": "Tài khoản không tồn tại"})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Mật khẩu không đúng"})

        # --- Check login rules ---
        if "@" in identifier:
            # Login bằng email
            if identifier.endswith("@gmail.com") and user.role != "customer":
                raise serializers.ValidationError({"identifier": "Email này chỉ dành cho user"})
            if identifier.endswith("@evaccine.com") and user.role not in ["staff", "admin", "superadmin"]:
                raise serializers.ValidationError({"identifier": "Email này chỉ dành cho staff hoặc admin"})
        else:
            # Login bằng phone -> chỉ cho user
            if user.role != "customer":
                raise serializers.ValidationError({"identifier": "Số điện thoại chỉ dành cho user"})

        data['user'] = user
        return data


class CreateStaffSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CustomUser
        fields = ['full_name', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if not value.endswith("@evaccine.com"):
            raise serializers.ValidationError("Staff phải có email @evaccine.com")
        return value

    def validate_password(self, value):
        if " " in value:
            raise serializers.ValidationError("Mật khẩu không được chứa khoảng trắng")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 chữ hoa")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 chữ thường")
        if not re.search(r'[\W_]', value):
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt")
        if len(value) < 6:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự")
        return value


    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return CustomUser.objects.create(**validated_data)

class CreateStaffView(generics.CreateAPIView):    
    queryset = CustomUser.objects.all()
    serializer_class = CreateStaffSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response({"message": "Staff created successfully"}, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = serializer.save(is_staff=True, role="staff")
        MedicalStaff.objects.create(
            user=user,
            department=self.request.data.get("department", ""),
            specialization=self.request.data.get("specialization", ""),
            license_number=self.request.data.get("license_number", ""),
            work_shift=self.request.data.get("work_shift", "sáng"),
            notes=self.request.data.get("notes", "")
        )
class StaffLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('identifier')
        password = data.get('password')

        try:
            user = CustomUser.objects.get(email=identifier)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"identifier": "Tài khoản không tồn tại"})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Mật khẩu không đúng"})

        # Chỉ cho staff hoặc admin login
        if user.role not in ["staff", "admin", "superadmin"]:
            raise serializers.ValidationError({"identifier": "Email này không dành cho staff"})

        data['user'] = user
        return data