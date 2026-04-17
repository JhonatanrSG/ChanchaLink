from django.conf import settings
from django.db import models

from apps.equipos.models import Equipo
from apps.reservas.models import Reserva


class Partido(models.Model):
    class TipoPartido(models.TextChoices):
        PUBLICO = "publico", "Público"
        PRIVADO = "privado", "Privado"

    class NivelPartido(models.TextChoices):
        RECREATIVO = "recreativo", "Recreativo"
        INTERMEDIO = "intermedio", "Intermedio"
        COMPETITIVO = "competitivo", "Competitivo"

    class EstadoPartido(models.TextChoices):
        ABIERTO = "abierto", "Abierto"
        COMPLETO = "completo", "Completo"
        EN_JUEGO = "en_juego", "En juego"
        FINALIZADO = "finalizado", "Finalizado"
        CANCELADO = "cancelado", "Cancelado"

    reserva = models.OneToOneField(
        Reserva,
        on_delete=models.CASCADE,
        related_name="partido"
    )
    usuario_creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="partidos_creados"
    )
    equipo = models.ForeignKey(
        Equipo,
        on_delete=models.SET_NULL,
        related_name="partidos",
        blank=True,
        null=True
    )
    tipo_partido = models.CharField(
        max_length=20,
        choices=TipoPartido.choices
    )
    nivel_partido = models.CharField(
        max_length=20,
        choices=NivelPartido.choices,
        default=NivelPartido.RECREATIVO
    )
    descripcion = models.TextField(blank=True, null=True)
    jugadores_faltantes = models.PositiveIntegerField(default=0)
    jugadores_actuales = models.PositiveIntegerField(default=0)
    maximo_jugadores = models.PositiveIntegerField(default=10)
    estado_partido = models.CharField(
        max_length=20,
        choices=EstadoPartido.choices,
        default=EstadoPartido.ABIERTO
    )
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Partido"
        verbose_name_plural = "Partidos"
        ordering = ["-fecha_publicacion"]

    def __str__(self):
        return f"Partido {self.reserva.cancha.nombre} - {self.reserva.fecha_reserva}"


class PartidoPosicionNecesaria(models.Model):
    class NombrePosicion(models.TextChoices):
        ARQUERO = "arquero", "Arquero"
        DEFENSA = "defensa", "Defensa"
        MEDIO = "medio", "Medio"
        DELANTERO = "delantero", "Delantero"

    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name="posiciones_necesarias"
    )
    posicion = models.CharField(
        max_length=20,
        choices=NombrePosicion.choices
    )
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Posición necesaria del partido"
        verbose_name_plural = "Posiciones necesarias del partido"

    def __str__(self):
        return f"{self.partido} - {self.posicion} ({self.cantidad})"


class PostulacionPartido(models.Model):
    class EstadoPostulacion(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"
        CANCELADA = "cancelada", "Cancelada"

    class NombrePosicion(models.TextChoices):
        ARQUERO = "arquero", "Arquero"
        DEFENSA = "defensa", "Defensa"
        MEDIO = "medio", "Medio"
        DELANTERO = "delantero", "Delantero"

    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name="postulaciones"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="postulaciones_partidos"
    )
    posicion_postulada = models.CharField(
        max_length=20,
        choices=NombrePosicion.choices,
        blank=True,
        null=True
    )
    nota = models.TextField(blank=True, null=True)
    estado_postulacion = models.CharField(
        max_length=20,
        choices=EstadoPostulacion.choices,
        default=EstadoPostulacion.PENDIENTE
    )
    fecha_postulacion = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Postulación a partido"
        verbose_name_plural = "Postulaciones a partidos"
        ordering = ["-fecha_postulacion"]
        constraints = [
            models.UniqueConstraint(
                fields=["partido", "usuario"],
                name="unique_postulacion_por_usuario_y_partido"
            )
        ]

    def __str__(self):
        return f"{self.usuario.email} -> {self.partido}"