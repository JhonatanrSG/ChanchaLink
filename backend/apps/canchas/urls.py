from django.urls import path

from .views import (
    CanchaPublicListView,
    CanchaPublicDetailView,
    EmpresaCanchaListCreateView,
    EmpresaCanchaUpdateView,
    EmpresaCanchaEstadoUpdateView,
)

urlpatterns = [
    path("canchas/", CanchaPublicListView.as_view(), name="canchas-public-list"),
    path("canchas/<int:pk>/", CanchaPublicDetailView.as_view(), name="canchas-public-detail"),

    path("empresa/canchas/", EmpresaCanchaListCreateView.as_view(), name="empresa-canchas-list-create"),
    path("empresa/canchas/<int:pk>/", EmpresaCanchaUpdateView.as_view(), name="empresa-canchas-update"),
    path("empresa/canchas/<int:pk>/estado/", EmpresaCanchaEstadoUpdateView.as_view(), name="empresa-canchas-estado"),
]