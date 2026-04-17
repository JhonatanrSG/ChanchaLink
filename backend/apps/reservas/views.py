from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.canchas.models import Cancha
from .models import ConfiguracionPrecio
from .permissions import IsEmpresaUser
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import ConfiguracionPrecio, Reserva
from .serializers import (
    ConfiguracionPrecioSerializer,
    ConfiguracionPrecioEstadoSerializer,
    ReservaSerializer,
    ReservaGuestSerializer,
    DisponibilidadCanchaSerializer,
)
from datetime import datetime
from django.utils.dateparse import parse_date
from django.db import models

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.notificaciones.services import crear_notificacion

class EmpresaCanchaPreciosListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def get_cancha(self, request, cancha_id):
        if not hasattr(request.user, "empresa"):
            return None
        return get_object_or_404(Cancha, pk=cancha_id, empresa=request.user.empresa)

    def get(self, request, cancha_id):
        cancha = self.get_cancha(request, cancha_id)
        if cancha is None:
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        precios = cancha.configuraciones_precio.all().order_by("dia_semana", "hora_inicio")
        serializer = ConfiguracionPrecioSerializer(precios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, cancha_id):
        cancha = self.get_cancha(request, cancha_id)
        if cancha is None:
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConfiguracionPrecioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        precio = serializer.save(cancha=cancha)

        return Response(
            ConfiguracionPrecioSerializer(precio).data,
            status=status.HTTP_201_CREATED,
        )


class EmpresaPrecioUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def get_precio(self, request, pk):
        if not hasattr(request.user, "empresa"):
            return None
        return get_object_or_404(
            ConfiguracionPrecio,
            pk=pk,
            cancha__empresa=request.user.empresa
        )

    def put(self, request, pk):
        precio = self.get_precio(request, pk)
        if precio is None:
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConfiguracionPrecioSerializer(precio, data=request.data)
        serializer.is_valid(raise_exception=True)
        precio = serializer.save()

        return Response(
            ConfiguracionPrecioSerializer(precio).data,
            status=status.HTTP_200_OK,
        )


class EmpresaPrecioEstadoUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def get_precio(self, request, pk):
        if not hasattr(request.user, "empresa"):
            return None
        return get_object_or_404(
            ConfiguracionPrecio,
            pk=pk,
            cancha__empresa=request.user.empresa
        )

    def patch(self, request, pk):
        precio = self.get_precio(request, pk)
        if precio is None:
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConfiguracionPrecioEstadoSerializer(precio, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        precio = serializer.save()

        return Response(
            ConfiguracionPrecioSerializer(precio).data,
            status=status.HTTP_200_OK,
        )
class ReservaCreateView(generics.CreateAPIView):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        nombre_completo = f"{user.nombres} {user.apellidos}".strip()

        reserva = serializer.save(
            usuario=user,
            origen_reserva=Reserva.OrigenReserva.USUARIO_REGISTRADO,
            estado_reserva=Reserva.EstadoReserva.CONFIRMADA,
            fecha_confirmacion=timezone.now(),
            nombre_contacto=nombre_completo,
            celular_contacto=user.numero_celular,
            correo_contacto=user.email,
        )

        crear_notificacion(
            usuario=user,
            tipo_notificacion="reserva",
            titulo="Reserva confirmada",
            mensaje=(
                f"Tu reserva en {reserva.cancha.nombre} para el "
                f"{reserva.fecha_reserva} de {reserva.hora_inicio} a {reserva.hora_fin} "
                f"fue confirmada correctamente."
            ),
            referencia_id=reserva.id,
            referencia_tipo="reserva",
        )


class ReservaGuestCreateView(generics.CreateAPIView):
    serializer_class = ReservaGuestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        reserva = serializer.save(
            usuario=None,
            origen_reserva=Reserva.OrigenReserva.VISITANTE,
            estado_reserva=Reserva.EstadoReserva.CONFIRMADA,
            fecha_confirmacion=timezone.now(),
        )

        print("\n" + "=" * 70)
        print("[RESERVA VISITANTE CONFIRMADA]")
        print(f"Cancha: {reserva.cancha.nombre}")
        print(f"Fecha: {reserva.fecha_reserva}")
        print(f"Hora: {reserva.hora_inicio} - {reserva.hora_fin}")
        print(f"Contacto: {reserva.nombre_contacto} | {reserva.correo_contacto}")
        print("=" * 70 + "\n")


class MisReservasListView(generics.ListAPIView):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reserva.objects.filter(usuario=self.request.user).select_related("cancha", "usuario")


class ReservaDetailView(generics.RetrieveAPIView):
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reserva.objects.filter(usuario=self.request.user).select_related("cancha", "usuario")


class ReservaCancelarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        reserva = get_object_or_404(Reserva, pk=pk, usuario=request.user)

        if reserva.estado_reserva == Reserva.EstadoReserva.CANCELADA:
            return Response(
                {"detail": "La reserva ya está cancelada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reserva.estado_reserva = Reserva.EstadoReserva.CANCELADA
        reserva.save(update_fields=["estado_reserva"])

        return Response(
            ReservaSerializer(reserva).data,
            status=status.HTTP_200_OK,
        )

class CanchaDisponibilidadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, cancha_id):
        fecha_str = request.query_params.get("fecha")

        if not fecha_str:
            return Response(
                {"detail": "Debes enviar la fecha en query params. Ejemplo: ?fecha=2026-03-20"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fecha = parse_date(fecha_str)
        if not fecha:
            return Response(
                {"detail": "La fecha no tiene un formato válido. Usa YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cancha = get_object_or_404(Cancha, pk=cancha_id, activa=True)

        dias_map = {
            0: "lunes",
            1: "martes",
            2: "miercoles",
            3: "jueves",
            4: "viernes",
            5: "sabado",
            6: "domingo",
        }

        dia_semana = dias_map[fecha.weekday()]

        configuraciones = ConfiguracionPrecio.objects.filter(
            cancha=cancha,
            dia_semana=dia_semana,
            activa=True,
            fecha_vigencia_inicio__lte=fecha,
        ).filter(
            models.Q(fecha_vigencia_fin__isnull=True) |
            models.Q(fecha_vigencia_fin__gte=fecha)
        ).order_by("hora_inicio")

        reservas_ocupadas = Reserva.objects.filter(
            cancha=cancha,
            fecha_reserva=fecha,
            estado_reserva__in=[
                Reserva.EstadoReserva.PENDIENTE,
                Reserva.EstadoReserva.CONFIRMADA,
            ]
        )

        bloques = []

        for config in configuraciones:
            ocupado = reservas_ocupadas.filter(
                hora_inicio__lt=config.hora_fin,
                hora_fin__gt=config.hora_inicio
            ).exists()

            bloques.append({
                "hora_inicio": config.hora_inicio,
                "hora_fin": config.hora_fin,
                "valor": config.valor,
                "estado": "ocupado" if ocupado else "disponible",
            })

        serializer = DisponibilidadCanchaSerializer({
            "cancha": cancha.id,
            "nombre_cancha": cancha.nombre,
            "fecha": fecha,
            "bloques": bloques,
        })

        return Response(serializer.data, status=status.HTTP_200_OK)    

    
