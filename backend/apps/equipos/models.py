from django.conf import settings
from django.db import models


class Equipo(models.Model):
    nombre_equipo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="equipos_creados"
    )

    class Meta:
        verbose_name = "Equipo"
        verbose_name_plural = "Equipos"
        ordering = ["nombre_equipo"]

    def __str__(self):
        return self.nombre_equipo


class MiembroEquipo(models.Model):
    class RolEquipo(models.TextChoices):
        CAPITAN = "capitan", "Capitán"
        MIEMBRO = "miembro", "Miembro"

    equipo = models.ForeignKey(
        Equipo,
        on_delete=models.CASCADE,
        related_name="miembros"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="membresias_equipos"
    )
    rol_equipo = models.CharField(
        max_length=20,
        choices=RolEquipo.choices,
        default=RolEquipo.MIEMBRO
    )
    fecha_union = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Miembro de equipo"
        verbose_name_plural = "Miembros de equipo"
        constraints = [
            models.UniqueConstraint(
                fields=["equipo", "usuario"],
                name="unique_miembro_por_equipo"
            )
        ]

    def __str__(self):
        return f"{self.usuario.email} - {self.equipo.nombre_equipo}"