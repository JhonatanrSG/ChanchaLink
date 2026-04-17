from django.contrib import admin

from .models import ConfiguracionPrecio, Reserva


@admin.register(ConfiguracionPrecio)
class ConfiguracionPrecioAdmin(admin.ModelAdmin):
    list_display = (
        "cancha",
        "dia_semana",
        "hora_inicio",
        "hora_fin",
        "valor",
        "fecha_vigencia_inicio",
        "fecha_vigencia_fin",
        "activa",
    )
    search_fields = ("cancha__nombre", "cancha__empresa__nombre_empresa")
    list_filter = ("dia_semana", "activa", "cancha__empresa")
    ordering = ("cancha", "dia_semana", "hora_inicio")


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        "cancha",
        "usuario",
        "fecha_reserva",
        "hora_inicio",
        "hora_fin",
        "estado_reserva",
        "origen_reserva",
        "precio_final",
        "fecha_creacion",
    )
    search_fields = (
        "cancha__nombre",
        "usuario__email",
        "nombre_contacto",
        "correo_contacto",
    )
    list_filter = (
        "estado_reserva",
        "origen_reserva",
        "fecha_reserva",
        "cancha__empresa",
    )
    ordering = ("-fecha_reserva", "-hora_inicio")