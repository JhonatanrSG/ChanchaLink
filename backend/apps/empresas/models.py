from django.conf import settings
from django.db import models


class Empresa(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="empresa"
    )
    nombre_empresa = models.CharField(max_length=150)
    nit = models.CharField(max_length=50, unique=True)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    correo_contacto = models.EmailField()
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nombre_empresa"]

    def __str__(self):
        return self.nombre_empresa


class SoporteEmpresa(models.Model):
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="soportes"
    )
    nombre_contacto = models.CharField(max_length=120)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    correo = models.EmailField()
    telefono = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Soporte de empresa"
        verbose_name_plural = "Soportes de empresa"
        ordering = ["nombre_contacto"]

    def __str__(self):
        return f"{self.nombre_contacto} - {self.empresa.nombre_empresa}"