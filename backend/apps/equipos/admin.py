from django.contrib import admin

from .models import Equipo, MiembroEquipo


@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ("nombre_equipo", "creador", "activo", "fecha_creacion")
    search_fields = ("nombre_equipo", "creador__email")
    list_filter = ("activo",)


@admin.register(MiembroEquipo)
class MiembroEquipoAdmin(admin.ModelAdmin):
    list_display = ("equipo", "usuario", "rol_equipo", "activo", "fecha_union")
    search_fields = ("equipo__nombre_equipo", "usuario__email")
    list_filter = ("rol_equipo", "activo")