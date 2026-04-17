from rest_framework import serializers

from .models import Cancha


class CanchaPublicSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source="empresa.nombre_empresa", read_only=True)

    class Meta:
        model = Cancha
        fields = (
            "id",
            "nombre",
            "tipo_futbol",
            "capacidad_jugadores",
            "ubicacion",
            "descripcion",
            "imagen",
            "empresa_nombre",
        )


class CanchaEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cancha
        fields = (
            "id",
            "nombre",
            "tipo_futbol",
            "capacidad_jugadores",
            "ubicacion",
            "descripcion",
            "activa",
            "estado_operativo",
            "imagen",
            "fecha_registro",
        )
        read_only_fields = ("id", "fecha_registro")


class CanchaEstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cancha
        fields = ("activa", "estado_operativo")