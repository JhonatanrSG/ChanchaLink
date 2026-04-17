from rest_framework import serializers

from .models import Empresa, SoporteEmpresa


class SoporteEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoporteEmpresa
        fields = (
            "id",
            "nombre_contacto",
            "cargo",
            "correo",
            "telefono",
            "activo",
        )


class EmpresaSerializer(serializers.ModelSerializer):
    soportes = SoporteEmpresaSerializer(many=True, read_only=True)

    class Meta:
        model = Empresa
        fields = (
            "id",
            "nombre_empresa",
            "nit",
            "direccion",
            "telefono",
            "correo_contacto",
            "descripcion",
            "activa",
            "fecha_registro",
            "soportes",
        )


class EmpresaCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = (
            "nombre_empresa",
            "nit",
            "direccion",
            "telefono",
            "correo_contacto",
            "descripcion",
            "activa",
        )

    def validate_nit(self, value):
        queryset = Empresa.objects.filter(nit=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Ya existe una empresa registrada con ese NIT.")

        return value