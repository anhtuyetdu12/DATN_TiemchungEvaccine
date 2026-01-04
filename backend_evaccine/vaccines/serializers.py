from rest_framework import serializers
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, VaccinePackageGroup,  VaccinePackageDisease
from django.db.models import Max
from django.contrib.auth import get_user_model
User = get_user_model()

class DiseaseSerializer(serializers.ModelSerializer):
    """
    DiseaseSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize dữ liệu Disease phục vụ API.

    Business Meaning:
        Trả thông tin bệnh cho FE kèm theo số mũi cần tiêm
        để hiển thị phác đồ tiêm chủng.

    Notes:
        - dose_count được giới hạn tối đa 5 mũi theo UI hiện tại
        - không phản ánh toàn bộ phác đồ nếu doses_required > 5
    """
    dose_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Disease
        fields = "__all__"
        
    def get_dose_count(self, obj):
        if obj.doses_required is None:
            return 1
        return min(obj.doses_required, 5)

class VaccineCategorySerializer(serializers.ModelSerializer):
    """
    VaccineCategorySerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize danh mục vắc xin.

    Business Meaning:
        Dùng để phân loại và hiển thị vắc xin trên giao diện FE.

    Notes:
        - image được build absolute URL từ request
    """
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = VaccineCategory
        fields = "__all__"
        
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class VaccineSerializer(serializers.ModelSerializer):
    """
    VaccineSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize chi tiết vắc xin cho API.

    Business Meaning:
        Cung cấp đầy đủ thông tin vắc xin:
            - bệnh phòng ngừa
            - giá tiền
            - độ tuổi áp dụng
            - phác đồ tiêm (doses / interval)

    Notes:
        - hỗ trợ cả read (nested) và write (id) cho disease, category
        - các field như min_months, doses_used được annotate từ queryset
        - formatted_price chỉ dùng cho hiển thị
    """
    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField( queryset=Disease.objects.all(), source="disease", write_only=True )
    category = VaccineCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField( queryset=VaccineCategory.objects.all(), source="category", write_only=True)
    formatted_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    min_months = serializers.IntegerField(read_only=True)
    max_months = serializers.IntegerField(read_only=True, allow_null=True)
    doses_used = serializers.IntegerField(read_only=True)
    next_dose_number = serializers.IntegerField(read_only=True)
    
    doses_required = serializers.IntegerField( source="disease.doses_required", read_only=True)
    interval_days = serializers.IntegerField( source="disease.interval_days", read_only=True)

    class Meta:
        model = Vaccine
        fields = "__all__"

    def get_image(self, obj):
        if not getattr(obj, "image", None):
            return None
        try:
            url = obj.image.url
        except Exception:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_formatted_price(self, obj):
        if obj.price is not None:
            return f"{obj.price:,.0f} VNĐ"
        return "0 VNĐ"

class VaccinePackageDiseaseSerializer(serializers.ModelSerializer):
    """
    VaccinePackageDiseaseSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize cấu trúc bệnh – vắc xin trong gói tiêm.

    Business Meaning:
        Mỗi bệnh trong gói có thể có nhiều vắc xin tương ứng,
        FE hiển thị theo nhóm bệnh trong từng gói tiêm.

    Notes:
        - Nested serializer: Disease + list Vaccine
    """
    disease = DiseaseSerializer()
    vaccines = VaccineSerializer(many=True)

    class Meta:
        model = VaccinePackageDisease
        fields = ["id", "disease","vaccines"]

class VaccinePackageSerializer(serializers.ModelSerializer):
    """
    VaccinePackageSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize gói tiêm chủng.

    Business Meaning:
        Một gói tiêm bao gồm nhiều bệnh,
        mỗi bệnh có danh sách vắc xin phù hợp.

    Notes:
        - disease_groups được load sẵn bằng prefetch_related
        - group_name chỉ phục vụ hiển thị
    """

    disease_groups = VaccinePackageDiseaseSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source="group.title", read_only=True)
    image = serializers.SerializerMethodField()
    class Meta:
        model = VaccinePackage
        fields = [ "id", "name", "slug", "group_name", "description", "status","image",  "disease_groups" ]
        
    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class VaccinePackageGroupSerializer(serializers.ModelSerializer):
    """
    VaccinePackageGroupSerializer

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Serialize nhóm gói tiêm.

    Business Meaning:
        Gom nhiều gói tiêm theo chủ đề hoặc độ tuổi
        để FE hiển thị dạng section.

    Notes:
        - Chỉ trả về các package active
    """

    packages = VaccinePackageSerializer(many=True, read_only=True)

    class Meta:
        model = VaccinePackageGroup
        fields = ["id", "title", "description", "order", "status", "packages"]


