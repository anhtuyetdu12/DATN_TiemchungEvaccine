import re
from django.contrib.auth.hashers import make_password
from rest_framework import generics
from django.contrib.auth import get_user_model
import random, string
from rest_framework import serializers
from .models import CustomUser, MedicalStaff
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from records.models import FamilyMember

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    repassword = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True) 

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
    
# staff tạo mới khách hàng 
class StaffCreateCustomerSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    set_password = serializers.CharField(write_only=True)       # BẮT BUỘC
    repassword   = serializers.CharField(write_only=True)       # XÁC NHẬN
    
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=["male","female","other"], required=False, allow_blank=True
    )
    
    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        phone = (attrs.get("phone") or "").strip()
        pwd   = (attrs.get("set_password") or "").strip()
        repwd = (attrs.get("repassword") or "").strip()

        if not email and not phone:
            raise serializers.ValidationError({"detail": "Cần ít nhất email hoặc số điện thoại."})

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email đã tồn tại."})
        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Số điện thoại đã tồn tại."})

        # rule mật khẩu giống RegisterSerializer
        import re
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
        raw_password = (validated_data.get("set_password") or "").strip()

        dob = validated_data.get("date_of_birth")
        gender = (validated_data.get("gender") or "other").strip()
        
        user = User.objects.create_user(
            email=email or f"user{phone}@gmail.com",
            full_name=full_name,
            password=raw_password,
            phone=phone,
            role="customer",
            is_active=True,
            gender=gender if hasattr(User, "gender") else None,
            date_of_birth=dob if hasattr(User, "date_of_birth") else None,
        )

        # KHÔNG bắt đổi mật khẩu lần đầu
        user.must_change_password = False
        user.save(update_fields=["must_change_password"])

        # tạo member “Bản thân”
        from records.models import FamilyMember
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
        return {"user": user}
 
    
    
    
    