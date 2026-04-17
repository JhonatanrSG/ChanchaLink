from django.contrib import admin

from .models import Cancha


@admin.register(Cancha)
class CanchaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "empresa",
        "tipo_futbol",
        "capacidad_jugadores",
        "ubicacion",
        "estado_operativo",
        "activa",
        "fecha_registro",
    )
    search_fields = ("nombre", "empresa__nombre_empresa", "ubicacion")
    list_filter = ("tipo_futbol", "estado_operativo", "activa", "empresa")