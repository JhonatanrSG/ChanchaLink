from django.urls import path

from .views import (
    PartidoListCreateView,
    PartidoDetailView,
    PartidoCerrarView,
    MisPartidosListView,
    PartidoPosicionesListCreateView,
    PostularmePartidoView,
    PartidoPostulacionesListView,
    PostulacionAceptarView,
    PostulacionRechazarView,
    MisPostulacionesListView,
)

urlpatterns = [
    path("partidos/", PartidoListCreateView.as_view(), name="partidos-list-create"),
    path("partidos/mis-partidos/", MisPartidosListView.as_view(), name="mis-partidos"),
    path("partidos/<int:pk>/", PartidoDetailView.as_view(), name="partidos-detail"),
    path("partidos/<int:pk>/cerrar/", PartidoCerrarView.as_view(), name="partidos-cerrar"),

    path("partidos/<int:pk>/posiciones/", PartidoPosicionesListCreateView.as_view(), name="partidos-posiciones"),
    path("partidos/<int:pk>/postularme/", PostularmePartidoView.as_view(), name="partidos-postularme"),
    path("partidos/<int:pk>/postulaciones/", PartidoPostulacionesListView.as_view(), name="partidos-postulaciones"),

    path("postulaciones/<int:pk>/aceptar/", PostulacionAceptarView.as_view(), name="postulacion-aceptar"),
    path("postulaciones/<int:pk>/rechazar/", PostulacionRechazarView.as_view(), name="postulacion-rechazar"),
    path("postulaciones/mis-postulaciones/", MisPostulacionesListView.as_view(), name="mis-postulaciones"),
]