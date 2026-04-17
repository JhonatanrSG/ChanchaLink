from decimal import Decimal

from django.db import models
from rest_framework import serializers

from .models import ConfiguracionPrecio, Reserva


def obtener_dia_semana(fecha):
    dias_map = {
        0: "lunes",
        1: "martes",
        2: "miercoles",
        3: "jueves",
        4: "viernes",
        5: "sabado",
        6: "domingo",
    }
    return dias_map[fecha.weekday()]


def calcular_precio_y_validar_disponibilidad(cancha, fecha_reserva, hora_inicio, hora_fin):
    if hora_inicio >= hora_fin:
        raise serializers.ValidationError("La hora de inicio debe ser menor que la hora de fin.")

    dia_semana = obtener_dia_semana(fecha_reserva)

    configuraciones = ConfiguracionPrecio.objects.filter(
        cancha=cancha,
        dia_semana=dia_semana,
        activa=True,
        fecha_vigencia_inicio__lte=fecha_reserva,
    ).filter(
        models.Q(fecha_vigencia_fin__isnull=True) |
        models.Q(fecha_vigencia_fin__gte=fecha_reserva)
    ).order_by("hora_inicio")

    bloques = list(
        configuraciones.filter(
            hora_inicio__gte=hora_inicio,
            hora_fin__lte=hora_fin,
        )
    )

    if not bloques:
        raise serializers.ValidationError(
            "No existen configuraciones de precio para la franja solicitada."
        )

    # Validar que cubran exactamente la franja solicitada
    if bloques[0].hora_inicio != hora_inicio or bloques[-1].hora_fin != hora_fin:
        raise serializers.ValidationError(
            "La franja solicitada no coincide con bloques configurados válidos."
        )

    # Validar continuidad entre bloques
    for i in range(len(bloques) - 1):
        if bloques[i].hora_fin != bloques[i + 1].hora_inicio:
            raise serializers.ValidationError(
                "La reserva debe estar compuesta por bloques horarios consecutivos."
            )

    # Validar ocupación
    reservas_ocupadas = Reserva.objects.filter(
        cancha=cancha,
        fecha_reserva=fecha_reserva,
        estado_reserva__in=[
            Reserva.EstadoReserva.PENDIENTE,
            Reserva.EstadoReserva.CONFIRMADA,
        ]
    )

    for bloque in bloques:
        ocupado = reservas_ocupadas.filter(
            hora_inicio__lt=bloque.hora_fin,
            hora_fin__gt=bloque.hora_inicio,
        ).exists()

        if ocupado:
            raise serializers.ValidationError(
                f"La franja {bloque.hora_inicio} - {bloque.hora_fin} ya se encuentra ocupada."
            )

    precio_total = sum((bloque.valor for bloque in bloques), Decimal("0.00"))
    return precio_total