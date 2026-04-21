from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from apps.reservas.models import Reserva
from .models import Cancha
from .serializers import (
    CanchaPublicSerializer,
    CanchaEmpresaSerializer,
    CanchaEstadoSerializer,
)
from .permissions import IsEmpresaUser


class CanchaPublicListView(generics.ListAPIView):
    serializer_class = CanchaPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Cancha.objects.filter(
                activa=True,
                estado_operativo=Cancha.EstadoOperativo.ACTIVA,
            )
            .select_related("empresa")
            .annotate(
                total_reservas=Count(
                    "reservas",
                    filter=Q(
                        reservas__estado_reserva__in=[
                            Reserva.EstadoReserva.CONFIRMADA,
                            Reserva.EstadoReserva.FINALIZADA,
                        ]
                    ),
                )
            )
            .order_by("-total_reservas", "nombre")
        )

class CanchaPublicDetailView(generics.RetrieveAPIView):
    serializer_class = CanchaPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Cancha.objects.filter(
            activa=True,
            estado_operativo=Cancha.EstadoOperativo.ACTIVA,
        ).select_related("empresa")


class EmpresaCanchaListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def get(self, request):
        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        canchas = Cancha.objects.filter(empresa=request.user.empresa).order_by("nombre")
        serializer = CanchaEmpresaSerializer(canchas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CanchaEmpresaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cancha = serializer.save(empresa=request.user.empresa)

        return Response(
            CanchaEmpresaSerializer(cancha).data,
            status=status.HTTP_201_CREATED,
        )


class EmpresaCanchaUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def put(self, request, pk):
        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cancha = get_object_or_404(Cancha, pk=pk, empresa=request.user.empresa)
        serializer = CanchaEmpresaSerializer(cancha, data=request.data)
        serializer.is_valid(raise_exception=True)
        cancha = serializer.save()

        return Response(
            CanchaEmpresaSerializer(cancha).data,
            status=status.HTTP_200_OK,
        )


class EmpresaCanchaEstadoUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def patch(self, request, pk):
        if not hasattr(request.user, "empresa"):
            return Response(
                {"detail": "El usuario empresa no tiene perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cancha = get_object_or_404(Cancha, pk=pk, empresa=request.user.empresa)
        serializer = CanchaEstadoSerializer(cancha, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cancha = serializer.save()

        return Response(
            CanchaEmpresaSerializer(cancha).data,
            status=status.HTTP_200_OK,
        )