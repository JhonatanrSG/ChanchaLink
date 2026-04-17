from django.urls import path

from .views import EmpresaProfileView

urlpatterns = [
    path("empresa/profile/", EmpresaProfileView.as_view(), name="empresa-profile"),
]