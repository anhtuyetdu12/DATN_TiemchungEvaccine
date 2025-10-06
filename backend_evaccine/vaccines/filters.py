import django_filters
from .models import Vaccine

class VaccineFilter(django_filters.FilterSet):
    # filter theo disease_id (id bệnh)
    disease = django_filters.NumberFilter(field_name="disease__id", lookup_expr="exact")
    # filter theo origin (nguồn gốc, ví dụ: "Việt Nam", "Mỹ", "Nhật")
    origin = django_filters.CharFilter(field_name="origin", lookup_expr="icontains")
    # filter theo age_group (nhóm tuổi, ví dụ: "0-12 tháng", "6-12 tuổi")
    age_group = django_filters.CharFilter(field_name="age_group", lookup_expr="icontains")

    class Meta:
        model = Vaccine
        fields = ["disease", "origin", "age_group", "status"]
