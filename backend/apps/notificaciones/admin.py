from django.contrib import admin

from .models import Notificacion


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = (
        "usuario",
        "tipo_notificacion",
        "titulo",
        "leida",
        "fecha_envio",
        "referencia_tipo",
        "referencia_id",
    )
    search_fields = ("usuario__email", "titulo", "mensaje")
    list_filter = ("tipo_notificacion", "leida", "fecha_envio")
    ordering = ("-fecha_envio",)