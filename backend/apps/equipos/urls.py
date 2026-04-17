from django.urls import path

from .views import (
    EquipoListCreateView,
    EquipoDetailView,
    EquipoMiembroCreateView,
    EquipoMiembroDeleteView,
)

urlpatterns = [
    path("equipos/", EquipoListCreateView.as_view(), name="equipos-list-create"),
    path("equipos/<int:pk>/", EquipoDetailView.as_view(), name="equipos-detail"),
    path("equipos/<int:pk>/miembros/", EquipoMiembroCreateView.as_view(), name="equipos-miembro-create"),
    path("equipos/<int:pk>/miembros/<int:miembro_id>/", EquipoMiembroDeleteView.as_view(), name="equipos-miembro-delete"),
]