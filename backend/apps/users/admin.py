from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, PerfilJugador, PosicionJugador, HistorialNivelJugador


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "nombres", "apellidos", "rol", "estado_cuenta", "is_staff", "is_active")
    search_fields = ("email", "nombres", "apellidos")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Información personal", {"fields": ("nombres", "apellidos", "numero_celular", "fecha_nacimiento", "sexo", "foto_perfil")}),
        ("Rol y estado", {"fields": ("rol", "estado_cuenta")}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nombres", "apellidos", "password1", "password2", "rol", "is_staff", "is_active"),
            },
        ),
    )

    filter_horizontal = ("groups", "user_permissions")


@admin.register(PerfilJugador)
class PerfilJugadorAdmin(admin.ModelAdmin):
    list_display = ("user", "nivel_actual", "partidos_confirmados", "reputacion", "activo")
    search_fields = ("user__email", "user__nombres", "user__apellidos")


@admin.register(PosicionJugador)
class PosicionJugadorAdmin(admin.ModelAdmin):
    list_display = ("perfil_jugador", "nombre_posicion", "principal")
    list_filter = ("nombre_posicion", "principal")


@admin.register(HistorialNivelJugador)
class HistorialNivelJugadorAdmin(admin.ModelAdmin):
    list_display = ("user", "nivel_anterior", "nivel_nuevo", "partidos_acumulados", "fecha_cambio")
    search_fields = ("user__email",)
    ordering = ("-fecha_cambio",)