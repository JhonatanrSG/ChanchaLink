from django.urls import path

from .views import (
    EmpresaCanchaPreciosListCreateView,
    EmpresaPrecioUpdateView,
    EmpresaPrecioEstadoUpdateView,
    ReservaCreateView,
    ReservaGuestCreateView,
    MisReservasListView,
    ReservaDetailView,
    ReservaCancelarView,
    CanchaDisponibilidadView,
)

urlpatterns = [
    path(
        "empresa/canchas/<int:cancha_id>/precios/",
        EmpresaCanchaPreciosListCreateView.as_view(),
        name="empresa-cancha-precios-list-create",
    ),
    path(
        "empresa/precios/<int:pk>/",
        EmpresaPrecioUpdateView.as_view(),
        name="empresa-precio-update",
    ),
    path(
        "empresa/precios/<int:pk>/estado/",
        EmpresaPrecioEstadoUpdateView.as_view(),
        name="empresa-precio-estado-update",
    ),

    path("reservas/", ReservaCreateView.as_view(), name="reserva-create"),
    path("reservas/guest/", ReservaGuestCreateView.as_view(), name="reserva-guest-create"),
    path("reservas/mis-reservas/", MisReservasListView.as_view(), name="mis-reservas"),
    path("reservas/<int:pk>/", ReservaDetailView.as_view(), name="reserva-detail"),
    path("reservas/<int:pk>/cancelar/", ReservaCancelarView.as_view(), name="reserva-cancelar"),
    path("canchas/<int:cancha_id>/disponibilidad/", CanchaDisponibilidadView.as_view(), name="cancha-disponibilidad"),
]