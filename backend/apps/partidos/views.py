from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notificaciones.services import crear_notificacion
from apps.equipos.models import MiembroEquipo
from .models import Partido, PartidoPosicionNecesaria, PostulacionPartido
from .serializers import (
    PartidoSerializer,
    PartidoCreateUpdateSerializer,
    PartidoPosicionNecesariaSerializer,
    PostulacionPartidoSerializer,
    PostulacionCreateSerializer,
)


class PartidoListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        hoy = timezone.localdate()
        ahora = timezone.localtime().time()

        queryset = Partido.objects.filter(
            estado_partido=Partido.EstadoPartido.ABIERTO,
            jugadores_faltantes__gt=0,
        ).filter(
            Q(reserva__fecha_reserva__gt=hoy) |
            Q(reserva__fecha_reserva=hoy, reserva__hora_fin__gt=ahora)
        )

        # Vigencia de publicación
        queryset = queryset.filter(
            Q(fecha_vencimiento__isnull=True) |
            Q(fecha_vencimiento__gte=timezone.now())
        )

        # Público / privado
        if request.user.is_authenticated:
            queryset = queryset.filter(
                Q(tipo_partido=Partido.TipoPartido.PUBLICO) |
                Q(usuario_creador=request.user) |
                Q(
                    tipo_partido=Partido.TipoPartido.PRIVADO,
                    equipo__miembros__usuario=request.user,
                    equipo__miembros__activo=True,
                )
            )
        else:
            queryset = queryset.filter(
                tipo_partido=Partido.TipoPartido.PUBLICO
            )

        partidos = (
            queryset
            .select_related("reserva__cancha", "usuario_creador", "equipo")
            .prefetch_related("posiciones_necesarias")
            .distinct()
            .order_by("fecha_vencimiento", "reserva__fecha_reserva", "reserva__hora_inicio")
        )

        serializer = PartidoSerializer(partidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PartidoCreateUpdateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        partido = serializer.save(usuario_creador=request.user)

        crear_notificacion(
            usuario=request.user,
            tipo_notificacion="partido",
            titulo="Partido publicado",
            mensaje=f"Has publicado un partido en {partido.reserva.cancha.nombre}.",
            referencia_id=partido.id,
            referencia_tipo="partido",
        )

        return Response(
            PartidoSerializer(partido).data,
            status=status.HTTP_201_CREATED,
        )


class PartidoDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        partido = get_object_or_404(
            Partido.objects.select_related("reserva__cancha", "usuario_creador", "equipo")
            .prefetch_related("posiciones_necesarias"),
            pk=pk
        )

        if partido.tipo_partido == Partido.TipoPartido.PRIVADO:
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Debes iniciar sesión para ver este partido privado."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            es_creador = partido.usuario_creador == request.user
            es_miembro = MiembroEquipo.objects.filter(
                equipo=partido.equipo,
                usuario=request.user,
                activo=True,
            ).exists()

            if not es_creador and not es_miembro:
                return Response(
                    {"detail": "No tienes permiso para ver este partido privado."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = PartidoSerializer(partido)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede editarlo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PartidoCreateUpdateSerializer(
            partido,
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        partido = serializer.save()

        return Response(
            PartidoSerializer(partido).data,
            status=status.HTTP_200_OK,
        )


class PartidoCerrarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede cerrarlo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        partido.estado_partido = Partido.EstadoPartido.CANCELADO
        partido.save(update_fields=["estado_partido"])

        return Response(
            PartidoSerializer(partido).data,
            status=status.HTTP_200_OK,
        )


class MisPartidosListView(generics.ListAPIView):
    serializer_class = PartidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Partido.objects.filter(
            usuario_creador=self.request.user
        ).select_related("reserva__cancha", "usuario_creador", "equipo").prefetch_related("posiciones_necesarias")


class PartidoPosicionesListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_partido(self, pk):
        return get_object_or_404(Partido, pk=pk)

    def get(self, request, pk):
        partido = self.get_partido(pk)
        serializer = PartidoPosicionNecesariaSerializer(partido.posiciones_necesarias.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        partido = self.get_partido(pk)

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede agregar posiciones necesarias."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PartidoPosicionNecesariaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(partido=partido)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PostularmePartidoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)

        if partido.estado_partido != Partido.EstadoPartido.ABIERTO:
            return Response(
                {"detail": "Solo puedes postularte a partidos abiertos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if partido.usuario_creador == request.user:
            return Response(
                {"detail": "No puedes postularte a un partido creado por ti mismo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if partido.tipo_partido == Partido.TipoPartido.PRIVADO:
            es_miembro = MiembroEquipo.objects.filter(
                equipo=partido.equipo,
                usuario=request.user,
                activo=True,
            ).exists()

            if not es_miembro:
                return Response(
                    {"detail": "Solo los miembros del equipo pueden postularse a este partido privado."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if PostulacionPartido.objects.filter(partido=partido, usuario=request.user).exists():
            return Response(
                {"detail": "Ya te postulaste a este partido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PostulacionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        postulacion = PostulacionPartido.objects.create(
            partido=partido,
            usuario=request.user,
            posicion_postulada=serializer.validated_data.get("posicion_postulada"),
            nota=serializer.validated_data.get("nota"),
            estado_postulacion=PostulacionPartido.EstadoPostulacion.PENDIENTE,
        )

        crear_notificacion(
            usuario=partido.usuario_creador,
            tipo_notificacion="postulacion",
            titulo="Nueva postulación recibida",
            mensaje=f"{request.user.email} se postuló a tu partido.",
            referencia_id=postulacion.id,
            referencia_tipo="postulacion",
        )

        return Response(
            PostulacionPartidoSerializer(postulacion).data,
            status=status.HTTP_201_CREATED,
        )


class PartidoPostulacionesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede ver las postulaciones."},
                status=status.HTTP_403_FORBIDDEN,
            )

        postulaciones = partido.postulaciones.select_related("usuario").all()
        serializer = PostulacionPartidoSerializer(postulaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PostulacionAceptarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        postulacion = get_object_or_404(PostulacionPartido, pk=pk)
        partido = postulacion.partido

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede aceptar postulaciones."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if postulacion.estado_postulacion == PostulacionPartido.EstadoPostulacion.ACEPTADA:
            return Response(
                {"detail": "Esta postulación ya fue aceptada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if partido.estado_partido != Partido.EstadoPartido.ABIERTO:
            return Response(
                {"detail": "Solo se pueden aceptar postulaciones en partidos abiertos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if partido.jugadores_faltantes <= 0:
            return Response(
                {"detail": "Este partido ya no tiene cupos disponibles."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        postulacion.estado_postulacion = PostulacionPartido.EstadoPostulacion.ACEPTADA
        postulacion.fecha_respuesta = timezone.now()
        postulacion.save(update_fields=["estado_postulacion", "fecha_respuesta"])

        partido.jugadores_actuales += 1
        partido.jugadores_faltantes -= 1

        if partido.jugadores_faltantes == 0:
            partido.estado_partido = Partido.EstadoPartido.COMPLETO

        partido.save(update_fields=["jugadores_actuales", "jugadores_faltantes", "estado_partido"])

        crear_notificacion(
            usuario=postulacion.usuario,
            tipo_notificacion="postulacion",
            titulo="Postulación aceptada",
            mensaje=f"Tu postulación al partido en {partido.reserva.cancha.nombre} fue aceptada.",
            referencia_id=postulacion.id,
            referencia_tipo="postulacion",
        )

        return Response(
            PostulacionPartidoSerializer(postulacion).data,
            status=status.HTTP_200_OK,
        )


class PostulacionRechazarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        postulacion = get_object_or_404(PostulacionPartido, pk=pk)
        partido = postulacion.partido

        if partido.usuario_creador != request.user:
            return Response(
                {"detail": "Solo el creador del partido puede rechazar postulaciones."},
                status=status.HTTP_403_FORBIDDEN,
            )

        postulacion.estado_postulacion = PostulacionPartido.EstadoPostulacion.RECHAZADA
        postulacion.fecha_respuesta = timezone.now()
        postulacion.save(update_fields=["estado_postulacion", "fecha_respuesta"])

        crear_notificacion(
            usuario=postulacion.usuario,
            tipo_notificacion="postulacion",
            titulo="Postulación rechazada",
            mensaje=f"Tu postulación al partido en {partido.reserva.cancha.nombre} fue rechazada.",
            referencia_id=postulacion.id,
            referencia_tipo="postulacion",
        )

        return Response(
            PostulacionPartidoSerializer(postulacion).data,
            status=status.HTTP_200_OK,
        )


class MisPostulacionesListView(generics.ListAPIView):
    serializer_class = PostulacionPartidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PostulacionPartido.objects.filter(
            usuario=self.request.user
        ).select_related("partido__reserva__cancha", "usuario")