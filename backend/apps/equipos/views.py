from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from .models import Equipo, MiembroEquipo
from .serializers import (
    EquipoSerializer,
    EquipoCreateUpdateSerializer,
    MiembroEquipoSerializer,
    MiembroEquipoCreateSerializer,
)


class EquipoListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        equipos = Equipo.objects.filter(
            miembros__usuario=request.user,
            miembros__activo=True,
            activo=True,
        ).distinct().prefetch_related("miembros__usuario")
        serializer = EquipoSerializer(equipos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = EquipoCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        equipo = serializer.save(creador=request.user)

        MiembroEquipo.objects.create(
            equipo=equipo,
            usuario=request.user,
            rol_equipo=MiembroEquipo.RolEquipo.CAPITAN,
            activo=True,
        )

        return Response(
            EquipoSerializer(equipo).data,
            status=status.HTTP_201_CREATED,
        )


class EquipoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(
            Equipo.objects.prefetch_related("miembros__usuario"),
            pk=pk,
            miembros__usuario=request.user,
            miembros__activo=True,
        )

    def get(self, request, pk):
        equipo = self.get_object(request, pk)
        serializer = EquipoSerializer(equipo)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        equipo = self.get_object(request, pk)

        if equipo.creador != request.user:
            return Response(
                {"detail": "Solo el creador del equipo puede editarlo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EquipoCreateUpdateSerializer(equipo, data=request.data)
        serializer.is_valid(raise_exception=True)
        equipo = serializer.save()

        return Response(
            EquipoSerializer(equipo).data,
            status=status.HTTP_200_OK,
        )


class EquipoMiembroCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        equipo = get_object_or_404(Equipo, pk=pk)

        if equipo.creador != request.user:
            return Response(
                {"detail": "Solo el creador del equipo puede agregar miembros."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MiembroEquipoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = get_object_or_404(User, pk=serializer.validated_data["usuario_id"])
        rol_equipo = serializer.validated_data["rol_equipo"]

        if MiembroEquipo.objects.filter(equipo=equipo, usuario=usuario).exists():
            return Response(
                {"detail": "El usuario ya pertenece a este equipo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        miembro = MiembroEquipo.objects.create(
            equipo=equipo,
            usuario=usuario,
            rol_equipo=rol_equipo,
            activo=True,
        )

        return Response(
            MiembroEquipoSerializer(miembro).data,
            status=status.HTTP_201_CREATED,
        )


class EquipoMiembroDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, miembro_id):
        equipo = get_object_or_404(Equipo, pk=pk)

        if equipo.creador != request.user:
            return Response(
                {"detail": "Solo el creador del equipo puede eliminar miembros."},
                status=status.HTTP_403_FORBIDDEN,
            )

        miembro = get_object_or_404(MiembroEquipo, pk=miembro_id, equipo=equipo)

        if miembro.usuario == equipo.creador:
            return Response(
                {"detail": "No puedes eliminar al creador/capitán del equipo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        miembro.delete()

        return Response(
            {"message": "Miembro eliminado correctamente."},
            status=status.HTTP_200_OK,
        )