from django.conf import settings
from django.db import models


class Notificacion(models.Model):
    class TipoNotificacion(models.TextChoices):
        RESERVA = "reserva", "Reserva"
        PARTIDO = "partido", "Partido"
        POSTULACION = "postulacion", "Postulación"
        SISTEMA = "sistema", "Sistema"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones"
    )
    tipo_notificacion = models.CharField(
        max_length=20,
        choices=TipoNotificacion.choices
    )
    titulo = models.CharField(max_length=150)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(auto_now_add=True)
    referencia_id = models.PositiveIntegerField(blank=True, null=True)
    referencia_tipo = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-fecha_envio"]

    def __str__(self):
        return f"{self.usuario.email} - {self.titulo}"