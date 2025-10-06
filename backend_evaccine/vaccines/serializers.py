from rest_framework import serializers
from .models import  Disease, VaccineCategory, Vaccine, VaccinePackage, Booking, VaccinePackageGroup,  VaccinePackageDisease



class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = "__all__"


class VaccineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineCategory
        fields = "__all__"
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class VaccineSerializer(serializers.ModelSerializer):
    disease = DiseaseSerializer(read_only=True)
    disease_id = serializers.PrimaryKeyRelatedField(
        queryset=Disease.objects.all(), source="disease", write_only=True
    )
    category = VaccineCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=VaccineCategory.objects.all(), source="category", write_only=True
    )
    formatted_price = serializers.SerializerMethodField()

    class Meta:
        model = Vaccine
        fields = "__all__"
        
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None
    def get_formatted_price(self, obj):
        if obj.price is not None:
            return f"{obj.price:,.0f} VNĐ"
        return "0 VNĐ"

class VaccinePackageDiseaseSerializer(serializers.ModelSerializer):
    disease = DiseaseSerializer()
    vaccines = VaccineSerializer(many=True)

    class Meta:
        model = VaccinePackageDisease
        fields = ["id", "disease", "vaccines"]


class VaccinePackageSerializer(serializers.ModelSerializer):
    disease_groups = VaccinePackageDiseaseSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source="group.title", read_only=True)

    class Meta:
        model = VaccinePackage
        fields = [
            "id", "name", "group_name", "description", "status","image",  "disease_groups"
        ]
        
    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class VaccinePackageGroupSerializer(serializers.ModelSerializer):
    packages = VaccinePackageSerializer(many=True, read_only=True)

    class Meta:
        model = VaccinePackageGroup
        fields = ["id", "title", "description", "order", "status", "packages"]

class BookingSerializer(serializers.ModelSerializer):
    vaccine = VaccineSerializer(read_only=True)
    vaccine_id = serializers.PrimaryKeyRelatedField(
        queryset=Vaccine.objects.all(), source="vaccine", write_only=True, required=False
    )
    package = VaccinePackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=VaccinePackage.objects.all(), source="package", write_only=True, required=False
    )

    class Meta:
        model = Booking
        fields = "__all__"
