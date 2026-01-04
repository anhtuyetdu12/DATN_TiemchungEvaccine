import re
from django.contrib.auth.hashers import make_password
from rest_framework import generics
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
import random, string
from rest_framework import serializers
from .models import CustomUser, MedicalStaff
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from records.models import FamilyMember


User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    """
    RegisterSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Validate và tạo mới tài khoản người dùng (customer).

    Business Meaning:
        Dùng cho API đăng ký tài khoản.
        Cho phép đăng ký bằng email hoặc số điện thoại.

    Notes:
        - Chỉ tạo user role = customer
        - Validate mật khẩu theo rule bảo mật
        - Không cho trùng email / phone
    """
    repassword = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True) 

    class Meta:
        model = CustomUser
        fields = ['full_name', 'email', 'phone', 'password', 'repassword']

    def validate_full_name(self, value):
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
        validated_data["role"] = "customer"   
        validated_data['password'] = make_password(validated_data['password'])
        return CustomUser.objects.create(**validated_data)
    
    
class LoginSerializer(serializers.Serializer):
    """
    LoginSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Validate dữ liệu đăng nhập người dùng.

    Business Meaning:
        Hỗ trợ đăng nhập bằng:
            - Email (customer / staff / admin)
            - Số điện thoại (chỉ customer)

    Notes:
        - Không sinh token (token xử lý ở View)
        - Chỉ validate thông tin đăng nhập
    """
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)
    remember = serializers.BooleanField(default=False)

    def validate_identifier(self, value):
        if "@" in value:
            if not (value.endswith("@gmail.com") or value.endswith("@evaccine.com")):
                raise serializers.ValidationError("Email phải có đuôi @gmail.com hoặc @evaccine.com")
            if " " in value:
                raise serializers.ValidationError("Email không được chứa khoảng trắng")
        else:
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

        if "@" in identifier:
            user = CustomUser.objects.filter(email=identifier).first()
        else:
            user = CustomUser.objects.filter(phone=identifier).first()

        if not user:
            raise serializers.ValidationError({"identifier": "Tài khoản không tồn tại"})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Mật khẩu không đúng"})

        if "@" in identifier:
            if identifier.endswith("@gmail.com") and user.role != "customer":
                raise serializers.ValidationError({"identifier": "Email này chỉ dành cho user"})
            if identifier.endswith("@evaccine.com") and user.role not in ["staff", "admin", "superadmin"]:
                raise serializers.ValidationError({"identifier": "Email này chỉ dành cho staff hoặc admin"})
        else:
            if user.role != "customer":
                raise serializers.ValidationError({"identifier": "Số điện thoại chỉ dành cho user"})

        data['user'] = user
        return data


class CreateStaffSerializer(serializers.ModelSerializer):
    """
    CreateStaffSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Validate và tạo tài khoản staff.

    Business Meaning:
        Dùng cho admin tạo tài khoản nhân viên nội bộ.

    Notes:
        - Chỉ chấp nhận email @evaccine.com
        - Không tạo MedicalStaff (xử lý ở View)
    """

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
    """
    StaffLoginSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Validate đăng nhập dành riêng cho staff / admin.

    Business Meaning:
        Chỉ cho phép nhân viên nội bộ đăng nhập hệ thống quản trị.

    Notes:
        - Không cho customer login
        - Không sinh token
    """
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

        if user.role not in ["staff", "admin", "superadmin"]:
            raise serializers.ValidationError({"identifier": "Email này không dành cho staff"})

        data['user'] = user
        return data
    
class StaffCreateCustomerSerializer(serializers.Serializer):
    """
    StaffCreateCustomerSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Cho phép staff tạo tài khoản khách hàng thay cho khách.

    Business Meaning:
        Staff có thể:
            - tạo khách chỉ có hồ sơ (chưa có mật khẩu)
            - hoặc tạo tài khoản đầy đủ để khách đăng nhập

    Notes:
        - Nếu không có password → sinh password tạm
        - Tự động tạo FamilyMember "Bản thân"
    """
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    set_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    repassword   = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField( choices=["male","female","other"], required=False, allow_blank=True )
    
    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        phone = (attrs.get("phone") or "").strip()
        pwd   = (attrs.get("set_password") or "").strip()
        repwd = (attrs.get("repassword") or "").strip()

        if not email and not phone:
            raise serializers.ValidationError({"detail": "Cần ít nhất email hoặc số điện thoại."})
        
        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Số điện thoại đã tồn tại."})
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email đã tồn tại."})

        if pwd or repwd:
            if not pwd:
                raise serializers.ValidationError({"set_password": "Vui lòng nhập mật khẩu"})
            if not repwd:
                raise serializers.ValidationError({"repassword": "Vui lòng nhập lại mật khẩu"})
            if " " in pwd:
                raise serializers.ValidationError({"set_password":"Mật khẩu không được chứa khoảng trắng"})
            if not re.search(r'[A-Z]', pwd):
                raise serializers.ValidationError({"set_password":"Mật khẩu phải có ít nhất 1 chữ hoa"})
            if not re.search(r'[a-z]', pwd):
                raise serializers.ValidationError({"set_password":"Mật khẩu phải có ít nhất 1 chữ thường"})
            if not re.search(r'[\W_]', pwd):
                raise serializers.ValidationError({"set_password":"Mật khẩu phải có ít nhất 1 ký tự đặc biệt"})
            if len(pwd) < 6:
                raise serializers.ValidationError({"set_password":"Mật khẩu phải có ít nhất 6 ký tự"})
            if pwd != repwd:
                raise serializers.ValidationError({"repassword":"Mật khẩu nhập lại không khớp"})

        return attrs

    def create(self, validated_data):
        full_name = validated_data["full_name"].strip()
        email = (validated_data.get("email") or "").strip() or None
        phone = (validated_data.get("phone") or "").strip() or None
        dob = validated_data.get("date_of_birth")
        gender = (validated_data.get("gender") or "other").strip()
        
        raw_password = (validated_data.get("set_password") or "").strip()
        has_password = bool(raw_password)
        if not has_password:
            raw_password = get_random_string(10)  
        
        user = User.objects.create_user(
            email=email or f"user{phone}@gmail.com",
            full_name=full_name,
            password=raw_password,
            phone=phone,
            role="customer",
            is_active=True,
            gender=gender,
            date_of_birth=dob,
        )

        if not FamilyMember.objects.filter(user=user, relation="Bản thân").exists():
            FamilyMember.objects.create(
                user=user,
                full_name=user.full_name or user.email,
                nickname=user.full_name or user.email,
                relation="Bản thân",
                gender=gender,
                date_of_birth=dob,       
                phone=user.phone or "",
                is_self=True,
            )
        return {"user": user, "has_password": has_password}
 
    
    
    
    