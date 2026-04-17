from django.contrib import admin

from .models import Partido, PartidoPosicionNecesaria, PostulacionPartido


@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = (
        "reserva",
        "usuario_creador",
        "tipo_partido",
        "nivel_partido",
        "jugadores_faltantes",
        "jugadores_actuales",
        "maximo_jugadores",
        "estado_partido",
        "fecha_publicacion",
    )
    search_fields = (
        "usuario_creador__email",
        "reserva__cancha__nombre",
        "descripcion",
    )
    list_filter = (
        "tipo_partido",
        "nivel_partido",
        "estado_partido",
    )


@admin.register(PartidoPosicionNecesaria)
class PartidoPosicionNecesariaAdmin(admin.ModelAdmin):
    list_display = ("partido", "posicion", "cantidad")
    list_filter = ("posicion",)
    search_fields = ("partido__reserva__cancha__nombre",)


@admin.register(PostulacionPartido)
class PostulacionPartidoAdmin(admin.ModelAdmin):
    list_display = (
        "partido",
        "usuario",
        "posicion_postulada",
        "estado_postulacion",
        "fecha_postulacion",
        "fecha_respuesta",
    )
    search_fields = (
        "usuario__email",
        "partido__reserva__cancha__nombre",
    )
    list_filter = (
        "estado_postulacion",
        "posicion_postulada",
    )