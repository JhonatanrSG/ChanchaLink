from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import date
from .models import User, PerfilJugador, PosicionJugador


def validar_numero_celular(value):
    if not value:
        return value

    if not value.isdigit():
        raise serializers.ValidationError("El número de celular solo debe contener dígitos.")

    if len(value) != 10:
        raise serializers.ValidationError("El número de celular debe tener exactamente 10 dígitos.")

    return value


def validar_mayoria_edad(value):
    if not value:
        return value

    hoy = timezone.localdate()
    edad = hoy.year - value.year - ((hoy.month, hoy.day) < (value.month, value.day))

    if edad < 18:
        raise serializers.ValidationError("Debes ser mayor de edad para registrarte.")

    return value    

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "nombres",
            "apellidos",
            "numero_celular",
            "fecha_nacimiento",
            "sexo",
            "rol",
        )

    def validate_rol(self, value):
        if value == User.Rol.ADMIN:
            raise serializers.ValidationError("No está permitido registrar administradores desde esta ruta.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)

        if user.rol == User.Rol.JUGADOR:
            PerfilJugador.objects.create(user=user)

        return user
    
    def validate_numero_celular(self, value):
        return validar_numero_celular(value)

    def validate_fecha_nacimiento(self, value):
        return validar_mayoria_edad(value)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError("Credenciales inválidas.")

        if not user.is_active:
            raise serializers.ValidationError("La cuenta está inactiva.")

        attrs["user"] = user
        return attrs


class PosicionJugadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PosicionJugador
        fields = ("id", "nombre_posicion", "principal")


class PerfilJugadorSerializer(serializers.ModelSerializer):
    posiciones = PosicionJugadorSerializer(many=True, read_only=True)

    class Meta:
        model = PerfilJugador
        fields = (
            "nivel_actual",
            "partidos_confirmados",
            "reputacion",
            "activo",
            "posiciones",
        )


class UserMeSerializer(serializers.ModelSerializer):
    perfil_jugador = PerfilJugadorSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "nombres",
            "apellidos",
            "numero_celular",
            "fecha_nacimiento",
            "sexo",
            "foto_perfil",
            "rol",
            "estado_cuenta",
            "date_joined",
            "perfil_jugador",
        )

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "nombres",
            "apellidos",
            "numero_celular",
            "fecha_nacimiento",
            "sexo",
            "foto_perfil",
        )
    def validate_numero_celular(self, value):
        return validar_numero_celular(value)

    def validate_fecha_nacimiento(self, value):
        return validar_mayoria_edad(value)



class PosicionJugadorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PosicionJugador
        fields = ("id", "nombre_posicion", "principal")

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        if not hasattr(user, "perfil_jugador"):
            raise serializers.ValidationError("El usuario no tiene perfil de jugador.")

        perfil = user.perfil_jugador
        nombre_posicion = attrs.get("nombre_posicion")
        principal = attrs.get("principal", False)

        if PosicionJugador.objects.filter(
            perfil_jugador=perfil,
            nombre_posicion=nombre_posicion
        ).exists():
            raise serializers.ValidationError("Esa posición ya existe para este jugador.")

        if principal:
            PosicionJugador.objects.filter(
                perfil_jugador=perfil,
                principal=True
            ).update(principal=False)

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        perfil = request.user.perfil_jugador

        return PosicionJugador.objects.create(
            perfil_jugador=perfil,
            **validated_data
        )

class UserSerializer(serializers.ModelSerializer):
    perfil_jugador = PerfilJugadorSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "nombres",
            "apellidos",
            "numero_celular",
            "fecha_nacimiento",
            "sexo",
            "foto_perfil",
            "rol",
            "estado_cuenta",
            "date_joined",
            "perfil_jugador",
        )
        read_only_fields = (
            "id",
            "rol",
            "estado_cuenta",
            "date_joined",
            "perfil_jugador",
        )
    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este correo.")
        return value

    def validate_numero_celular(self, value):
        return validar_numero_celular(value)

    def validate_fecha_nacimiento(self, value):
        return validar_mayoria_edad(value)  
              