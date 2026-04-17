from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Empresa
from .serializers import EmpresaSerializer, EmpresaCreateUpdateSerializer
from .permissions import IsEmpresaUser


class EmpresaProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmpresaUser]

    def get(self, request):
        try:
            empresa = request.user.empresa
        except Empresa.DoesNotExist:
            return Response(
                {"detail": "El usuario empresa aún no tiene un perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EmpresaSerializer(empresa)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if hasattr(request.user, "empresa"):
            return Response(
                {"detail": "Este usuario ya tiene una empresa registrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EmpresaCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        empresa = serializer.save(user=request.user)

        return Response(
            EmpresaSerializer(empresa).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        try:
            empresa = request.user.empresa
        except Empresa.DoesNotExist:
            return Response(
                {"detail": "El usuario empresa aún no tiene un perfil de empresa creado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EmpresaCreateUpdateSerializer(
            empresa,
            data=request.data,
            partial=False,
        )
        serializer.is_valid(raise_exception=True)
        empresa = serializer.save()

        return Response(
            EmpresaSerializer(empresa).data,
            status=status.HTTP_200_OK,
        )