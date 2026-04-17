from django.conf import settings
from django.db import models

from apps.canchas.models import Cancha


class ConfiguracionPrecio(models.Model):
    class DiaSemana(models.TextChoices):
        LUNES = "lunes", "Lunes"
        MARTES = "martes", "Martes"
        MIERCOLES = "miercoles", "Miércoles"
        JUEVES = "jueves", "Jueves"
        VIERNES = "viernes", "Viernes"
        SABADO = "sabado", "Sábado"
        DOMINGO = "domingo", "Domingo"

    cancha = models.ForeignKey(
        Cancha,
        on_delete=models.CASCADE,
        related_name="configuraciones_precio"
    )
    dia_semana = models.CharField(
        max_length=15,
        choices=DiaSemana.choices
    )
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vigencia_inicio = models.DateField()
    fecha_vigencia_fin = models.DateField(blank=True, null=True)
    activa = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Configuración de precio"
        verbose_name_plural = "Configuraciones de precio"
        ordering = ["cancha", "dia_semana", "hora_inicio"]
        constraints = [
            models.UniqueConstraint(
                fields=["cancha", "dia_semana", "hora_inicio", "hora_fin", "fecha_vigencia_inicio"],
                name="unique_config_precio_por_franja"
            )
        ]

    def __str__(self):
        return f"{self.cancha.nombre} | {self.dia_semana} {self.hora_inicio}-{self.hora_fin} | ${self.valor}"


class Reserva(models.Model):
    class EstadoReserva(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        CONFIRMADA = "confirmada", "Confirmada"
        CANCELADA = "cancelada", "Cancelada"
        FINALIZADA = "finalizada", "Finalizada"

    class OrigenReserva(models.TextChoices):
        USUARIO_REGISTRADO = "usuario_registrado", "Usuario registrado"
        VISITANTE = "visitante", "Visitante"

    cancha = models.ForeignKey(
        Cancha,
        on_delete=models.CASCADE,
        related_name="reservas"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reservas",
        blank=True,
        null=True
    )
    fecha_reserva = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    estado_reserva = models.CharField(
        max_length=20,
        choices=EstadoReserva.choices,
        default=EstadoReserva.PENDIENTE
    )
    origen_reserva = models.CharField(
        max_length=25,
        choices=OrigenReserva.choices
    )

    nombre_contacto = models.CharField(max_length=120, blank=True, null=True)
    cedula_contacto = models.CharField(max_length=20, blank=True, null=True)
    celular_contacto = models.CharField(max_length=20, blank=True, null=True)
    correo_contacto = models.EmailField(blank=True, null=True)

    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_confirmacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"
        ordering = ["-fecha_reserva", "-hora_inicio", "-fecha_creacion"]

    def __str__(self):
        return f"{self.cancha.nombre} | {self.fecha_reserva} {self.hora_inicio}-{self.hora_fin}"