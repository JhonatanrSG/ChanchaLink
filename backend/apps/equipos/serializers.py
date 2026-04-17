from rest_framework import serializers

from apps.users.models import User
from .models import Equipo, MiembroEquipo


class MiembroEquipoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = MiembroEquipo
        fields = (
            "id",
            "usuario",
            "usuario_email",
            "usuario_nombre",
            "rol_equipo",
            "fecha_union",
            "activo",
        )
        read_only_fields = ("id", "fecha_union")

    def get_usuario_nombre(self, obj):
        return f"{obj.usuario.nombres} {obj.usuario.apellidos}"


class EquipoSerializer(serializers.ModelSerializer):
    creador_email = serializers.CharField(source="creador.email", read_only=True)
    miembros = MiembroEquipoSerializer(many=True, read_only=True)

    class Meta:
        model = Equipo
        fields = (
            "id",
            "nombre_equipo",
            "descripcion",
            "fecha_creacion",
            "activo",
            "creador",
            "creador_email",
            "miembros",
        )
        read_only_fields = ("id", "fecha_creacion", "creador", "creador_email", "miembros")


class EquipoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipo
        fields = (
            "nombre_equipo",
            "descripcion",
            "activo",
        )


class MiembroEquipoCreateSerializer(serializers.Serializer):
    usuario_id = serializers.IntegerField()
    rol_equipo = serializers.ChoiceField(
        choices=MiembroEquipo.RolEquipo.choices,
        default=MiembroEquipo.RolEquipo.MIEMBRO,
    )

    def validate_usuario_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("El usuario indicado no existe.")
        return value