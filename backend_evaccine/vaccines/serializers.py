from rest_framework import serializers
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, VaccinePackageGroup,  VaccinePackageDisease
from django.db.models import Max
from django.contrib.auth import get_user_model
User = get_user_model()

class DiseaseSerializer(serializers.ModelSerializer):
    dose_count = serializers.SerializerMethodField()

    class Meta:
        model = Disease
        fields = "__all__"

    def get_dose_count(self, obj):  # ← đổi tên cho khớp field
        from django.db.models import Max
        max_doses = obj.vaccines.aggregate(m=Max("doses_required")).get("m") or 1
        return min(max_doses, 5)


class VaccineCategorySerializer(serializers.ModelSerializer):
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
    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField( queryset=Disease.objects.all(), source="disease", write_only=True )
    category = VaccineCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField( queryset=VaccineCategory.objects.all(), source="category", write_only=True)
    formatted_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    # --- CÁC FIELD CHỈ ĐỌC TỪ ANNOTATE CỦA by_age ---
    min_months = serializers.IntegerField(read_only=True)
    max_months = serializers.IntegerField(read_only=True, allow_null=True)
    doses_used = serializers.IntegerField(read_only=True)
    next_dose_number = serializers.IntegerField(read_only=True)

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
    disease = DiseaseSerializer()
    vaccines = VaccineSerializer(many=True)

    class Meta:
        model = VaccinePackageDisease
        fields = ["id", "disease","vaccines"]


class VaccinePackageSerializer(serializers.ModelSerializer):
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
    # Lấy luôn danh sách gói thuộc group
    packages = VaccinePackageSerializer(many=True, read_only=True)

    class Meta:
        model = VaccinePackageGroup
        fields = ["id", "title", "description", "order", "status", "packages"]


