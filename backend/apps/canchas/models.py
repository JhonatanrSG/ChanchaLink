from django.db import models

from apps.empresas.models import Empresa


class Cancha(models.Model):
    class TipoFutbol(models.TextChoices):
        FUTBOL_5 = "futbol_5", "Fútbol 5"
        FUTBOL_6 = "futbol_6", "Fútbol 6"
        FUTBOL_7 = "futbol_7", "Fútbol 7"
        FUTBOL_11 = "futbol_11", "Fútbol 11"

    class EstadoOperativo(models.TextChoices):
        ACTIVA = "activa", "Activa"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"
        INACTIVA = "inactiva", "Inactiva"

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="canchas"
    )
    nombre = models.CharField(max_length=120)
    tipo_futbol = models.CharField(
        max_length=20,
        choices=TipoFutbol.choices
    )
    capacidad_jugadores = models.PositiveIntegerField()
    ubicacion = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)
    estado_operativo = models.CharField(
        max_length=20,
        choices=EstadoOperativo.choices,
        default=EstadoOperativo.ACTIVA
    )
    imagen = models.ImageField(upload_to="canchas/", blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cancha"
        verbose_name_plural = "Canchas"
        ordering = ["empresa__nombre_empresa", "nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["empresa", "nombre"],
                name="unique_nombre_cancha_por_empresa"
            )
        ]

    def __str__(self):
        return f"{self.nombre} - {self.empresa.nombre_empresa}"