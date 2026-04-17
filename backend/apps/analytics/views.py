from django.utils import timezone

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservas.models import Reserva
from apps.partidos.models import Partido, PostulacionPartido
from apps.equipos.models import MiembroEquipo
from .serializers import UserDashboardSerializer

from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum, Count
from apps.canchas.models import Cancha

from .serializers import (
    UserDashboardSerializer,
    EmpresaDashboardSerializer,
    EmpresaEstadisticasSerializer,
)

class UserDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()

        reservas = Reserva.objects.filter(
            usuario=request.user
        ).select_related("cancha")

        proximas_reservas_qs = reservas.filter(
            fecha_reserva__gte=hoy
        ).order_by("fecha_reserva", "hora_inicio")[:5]

        partidos_qs = Partido.objects.filter(
            usuario_creador=request.user
        ).select_related("reserva__cancha").order_by("-fecha_publicacion")[:5]

        postulaciones_qs = PostulacionPartido.objects.filter(
            usuario=request.user
        ).select_related("partido__reserva__cancha").order_by("-fecha_postulacion")[:5]

        equipos_qs = MiembroEquipo.objects.filter(
            usuario=request.user,
            activo=True
        ).select_related("equipo").order_by("equipo__nombre_equipo")

        data = {
            "resumen": {
                "total_reservas": reservas.count(),
                "total_partidos_creados": Partido.objects.filter(usuario_creador=request.user).count(),
                "total_postulaciones": PostulacionPartido.objects.filter(usuario=request.user).count(),
                "total_equipos": equipos_qs.count(),
            },
            "proximas_reservas": [
                {
                    "id": r.id,
                    "cancha_nombre": r.cancha.nombre,
                    "fecha_reserva": r.fecha_reserva,
                    "hora_inicio": r.hora_inicio,
                    "hora_fin": r.hora_fin,
                    "estado_reserva": r.estado_reserva,
                    "precio_final": r.precio_final,
                }
                for r in proximas_reservas_qs
            ],
            "mis_partidos": [
                {
                    "id": p.id,
                    "cancha_nombre": p.reserva.cancha.nombre,
                    "fecha_reserva": p.reserva.fecha_reserva,
                    "hora_inicio": p.reserva.hora_inicio,
                    "hora_fin": p.reserva.hora_fin,
                    "estado_partido": p.estado_partido,
                    "tipo_partido": p.tipo_partido,
                    "nivel_partido": p.nivel_partido,
                    "jugadores_faltantes": p.jugadores_faltantes,
                }
                for p in partidos_qs
            ],
            "mis_postulaciones": [
                {
                    "id": po.id,
                    "partido_id": po.partido.id,
                    "cancha_nombre": po.partido.reserva.cancha.nombre,
                    "fecha_reserva": po.partido.reserva.fecha_reserva,
                    "estado_postulacion": po.estado_postulacion,
                    "posicion_postulada": po.posicion_postulada,
                    "fecha_postulacion": po.fecha_postulacion,
                }
                for po in postulaciones_qs
            ],
            "mis_equipos": [
                {
                    "id": me.equipo.id,
                    "nombre_equipo": me.equipo.nombre_equipo,
                    "rol_equipo": me.rol_equipo,
                    "activo": me.activo,
                }
                for me in equipos_qs
            ],
        }

        serializer = UserDashboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class EmpresaDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.rol != "empresa":
            return Response(
                {"detail": "Solo los usuarios empresa pueden acceder a este recurso."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil empresarial creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        empresa = request.user.empresa
        hoy = timezone.localdate()

        canchas_qs = Cancha.objects.filter(empresa=empresa).order_by("nombre")
        reservas_qs = Reserva.objects.filter(cancha__empresa=empresa).select_related("cancha", "usuario")
        partidos_qs = Partido.objects.filter(reserva__cancha__empresa=empresa)

        reservas_hoy_qs = reservas_qs.filter(fecha_reserva=hoy)
        ingresos_hoy = reservas_hoy_qs.filter(
            estado_reserva__in=[
                Reserva.EstadoReserva.PENDIENTE,
                Reserva.EstadoReserva.CONFIRMADA,
                Reserva.EstadoReserva.FINALIZADA,
            ]
        ).aggregate(total=Sum("precio_final"))["total"] or Decimal("0.00")

        data = {
            "resumen": {
                "total_canchas": canchas_qs.count(),
                "reservas_activas": reservas_qs.filter(
                    estado_reserva__in=[
                        Reserva.EstadoReserva.PENDIENTE,
                        Reserva.EstadoReserva.CONFIRMADA,
                    ]
                ).count(),
                "reservas_hoy": reservas_hoy_qs.count(),
                "ingresos_hoy": ingresos_hoy,
                "partidos_activos": partidos_qs.filter(
                    estado_partido__in=[
                        Partido.EstadoPartido.ABIERTO,
                        Partido.EstadoPartido.COMPLETO,
                        Partido.EstadoPartido.EN_JUEGO,
                    ]
                ).count(),
            },
            "canchas": [
                {
                    "id": c.id,
                    "nombre": c.nombre,
                    "tipo_futbol": c.tipo_futbol,
                    "estado_operativo": c.estado_operativo,
                    "activa": c.activa,
                    "imagen": c.imagen.url if c.imagen else None,
                }
                for c in canchas_qs
            ],
            "ultimas_reservas": [
                {
                    "id": r.id,
                    "cancha_nombre": r.cancha.nombre,
                    "fecha_reserva": r.fecha_reserva,
                    "hora_inicio": r.hora_inicio,
                    "hora_fin": r.hora_fin,
                    "estado_reserva": r.estado_reserva,
                    "precio_final": r.precio_final,
                    "usuario_email": r.usuario.email if r.usuario else None,
                    "nombre_contacto": r.nombre_contacto,
                }
                for r in reservas_qs.order_by("-fecha_creacion")[:5]
            ],
        }

        serializer = EmpresaDashboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmpresaEstadisticasView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.rol != "empresa":
            return Response(
                {"detail": "Solo los usuarios empresa pueden acceder a este recurso."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil empresarial creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        periodo = request.query_params.get("periodo", "dia")
        if periodo not in ["dia", "semana", "mes"]:
            return Response(
                {"detail": "El periodo debe ser: dia, semana o mes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        empresa = request.user.empresa
        hoy = timezone.localdate()

        if periodo == "dia":
            fecha_inicio = hoy
            fecha_fin = hoy
        elif periodo == "semana":
            fecha_inicio = hoy - timedelta(days=6)
            fecha_fin = hoy
        else:
            fecha_inicio = hoy - timedelta(days=29)
            fecha_fin = hoy

        reservas_qs = Reserva.objects.filter(
            cancha__empresa=empresa,
            fecha_reserva__range=[fecha_inicio, fecha_fin],
            estado_reserva__in=[
                Reserva.EstadoReserva.PENDIENTE,
                Reserva.EstadoReserva.CONFIRMADA,
                Reserva.EstadoReserva.FINALIZADA,
            ]
        ).select_related("cancha")

        serie = []
        actual = fecha_inicio
        while actual <= fecha_fin:
            reservas_dia = reservas_qs.filter(fecha_reserva=actual)
            ingresos_dia = reservas_dia.aggregate(total=Sum("precio_final"))["total"] or Decimal("0.00")

            serie.append({
                "label": str(actual),
                "reservas": reservas_dia.count(),
                "ingresos": ingresos_dia,
            })
            actual += timedelta(days=1)

        ingresos_por_cancha_qs = (
            reservas_qs.values("cancha_id", "cancha__nombre")
            .annotate(
                ingresos=Sum("precio_final"),
                reservas=Count("id")
            )
            .order_by("-ingresos")
        )

        data = {
            "periodo": periodo,
            "total_reservas": reservas_qs.count(),
            "total_ingresos": reservas_qs.aggregate(total=Sum("precio_final"))["total"] or Decimal("0.00"),
            "serie": serie,
            "ingresos_por_cancha": [
                {
                    "cancha_id": item["cancha_id"],
                    "cancha_nombre": item["cancha__nombre"],
                    "ingresos": item["ingresos"] or Decimal("0.00"),
                    "reservas": item["reservas"],
                }
                for item in ingresos_por_cancha_qs
            ],
        }

        serializer = EmpresaEstadisticasSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)