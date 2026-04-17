from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import User
from .serializers import UserSerializer

from .models import PosicionJugador
from .serializers import (
    UserProfileUpdateSerializer,
    PosicionJugadorSerializer,
    PosicionJugadorCreateSerializer,
)



from .models import User
from .serializers import (
    UserRegisterSerializer,
    UserLoginSerializer,
    UserMeSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Inicio de sesión exitoso.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserMeSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class UserProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser,FormParser]
    def get_object(self):
        return self.request.user


class UserPositionsListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "perfil_jugador"):
            return Response(
                {"detail": "El usuario no tiene perfil de jugador."},
                status=status.HTTP_400_BAD_REQUEST
            )

        posiciones = request.user.perfil_jugador.posiciones.all()
        serializer = PosicionJugadorSerializer(posiciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PosicionJugadorCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserPositionDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not hasattr(request.user, "perfil_jugador"):
            return Response(
                {"detail": "El usuario no tiene perfil de jugador."},
                status=status.HTTP_400_BAD_REQUEST
            )

        posicion = get_object_or_404(
            PosicionJugador,
            pk=pk,
            perfil_jugador=request.user.perfil_jugador
        )
        posicion.delete()
        return Response(
            {"message": "Posición eliminada correctamente."},
            status=status.HTTP_200_OK
        )

class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)  