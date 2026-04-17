from django.urls import path

from .views import UserDashboardView, EmpresaDashboardView, EmpresaEstadisticasView

urlpatterns = [
    path("users/dashboard/", UserDashboardView.as_view(), name="users-dashboard"),
    path("empresa/dashboard/", EmpresaDashboardView.as_view(), name="empresa-dashboard"),
    path("empresa/estadisticas/", EmpresaEstadisticasView.as_view(), name="empresa-estadisticas"),
]