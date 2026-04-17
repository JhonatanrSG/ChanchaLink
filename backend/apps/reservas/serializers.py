from rest_framework import serializers
from .models import ConfiguracionPrecio, Reserva
from django.utils import timezone
from .services import calcular_precio_y_validar_disponibilidad

class ConfiguracionPrecioSerializer(serializers.ModelSerializer):
    cancha_nombre = serializers.CharField(source="cancha.nombre", read_only=True)

    class Meta:
        model = ConfiguracionPrecio
        fields = (
            "id",
            "cancha",
            "cancha_nombre",
            "dia_semana",
            "hora_inicio",
            "hora_fin",
            "valor",
            "fecha_vigencia_inicio",
            "fecha_vigencia_fin",
            "activa",
            "fecha_registro",
        )
        read_only_fields = ("id", "cancha", "cancha_nombre", "fecha_registro")

    def validate(self, attrs):
        hora_inicio = attrs.get("hora_inicio", getattr(self.instance, "hora_inicio", None))
        hora_fin = attrs.get("hora_fin", getattr(self.instance, "hora_fin", None))
        fecha_vigencia_inicio = attrs.get(
            "fecha_vigencia_inicio",
            getattr(self.instance, "fecha_vigencia_inicio", None)
        )
        fecha_vigencia_fin = attrs.get(
            "fecha_vigencia_fin",
            getattr(self.instance, "fecha_vigencia_fin", None)
        )

        if hora_inicio and hora_fin and hora_inicio >= hora_fin:
            raise serializers.ValidationError("La hora de inicio debe ser menor que la hora de fin.")

        if fecha_vigencia_inicio and fecha_vigencia_fin and fecha_vigencia_inicio > fecha_vigencia_fin:
            raise serializers.ValidationError("La fecha de vigencia inicial no puede ser mayor a la final.")

        return attrs


class ConfiguracionPrecioEstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionPrecio
        fields = ("activa",)

class ReservaSerializer(serializers.ModelSerializer):
    cancha_nombre = serializers.CharField(source="cancha.nombre", read_only=True)
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    cancha_imagen = serializers.ImageField(source="cancha.imagen", read_only=True)

    class Meta:
        model = Reserva
        fields = (
            "id",
            "cancha",
            "cancha_nombre",
            "cancha_imagen",
            "usuario",
            "usuario_email",
            "fecha_reserva",
            "hora_inicio",
            "hora_fin",
            "estado_reserva",
            "origen_reserva",
            "nombre_contacto",
            "celular_contacto",
            "correo_contacto",
            "cedula_contacto",
            "precio_final",
            "fecha_creacion",
            "fecha_confirmacion",
        )
        read_only_fields = (
            "id",
            "usuario",
            "usuario_email",
            "estado_reserva",
            "origen_reserva",
            "nombre_contacto",
            "celular_contacto",
            "correo_contacto",
            "precio_final",
            "fecha_creacion",
            "fecha_confirmacion",
        )

    def validate(self, attrs):
        hora_inicio = attrs.get("hora_inicio")
        hora_fin = attrs.get("hora_fin")
        fecha_reserva = attrs.get("fecha_reserva")
        cancha = attrs.get("cancha")

        if hora_inicio >= hora_fin:
            raise serializers.ValidationError("La hora de inicio debe ser menor que la hora de fin.")

        if fecha_reserva < timezone.localdate():
            raise serializers.ValidationError("No se puede crear una reserva en una fecha pasada.")

        precio_total = calcular_precio_y_validar_disponibilidad(
            cancha=cancha,
            fecha_reserva=fecha_reserva,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
        )

        attrs["precio_calculado"] = precio_total
        return attrs

    def create(self, validated_data):
        precio_total = validated_data.pop("precio_calculado")
        validated_data["precio_final"] = precio_total
        return super().create(validated_data)


class ReservaGuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = (
            "cancha",
            "fecha_reserva",
            "hora_inicio",
            "hora_fin",
            "nombre_contacto",
            "celular_contacto",
            "correo_contacto",
            "cedula_contacto",
            "precio_final",
        )
        read_only_fields = ("precio_final",)

    def validate(self, attrs):
        hora_inicio = attrs.get("hora_inicio")
        hora_fin = attrs.get("hora_fin")
        fecha_reserva = attrs.get("fecha_reserva")
        cancha = attrs.get("cancha")

        if hora_inicio >= hora_fin:
            raise serializers.ValidationError("La hora de inicio debe ser menor que la hora de fin.")

        if fecha_reserva < timezone.localdate():
            raise serializers.ValidationError("No se puede crear una reserva en una fecha pasada.")

        if (
            not attrs.get("nombre_contacto")
            or not attrs.get("celular_contacto")
            or not attrs.get("correo_contacto")
            or not attrs.get("cedula_contacto")
        ):
            raise serializers.ValidationError(
                "Para reservas de visitante debes enviar nombre_contacto, celular_contacto, correo_contacto y cedula_contacto."
            )

        precio_total = calcular_precio_y_validar_disponibilidad(
            cancha=cancha,
            fecha_reserva=fecha_reserva,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
        )

        attrs["precio_calculado"] = precio_total
        return attrs

    def create(self, validated_data):
        precio_total = validated_data.pop("precio_calculado")
        validated_data["precio_final"] = precio_total
        return super().create(validated_data)


class ReservaCancelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = ("estado_reserva",)

class DisponibilidadBloqueSerializer(serializers.Serializer):
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    estado = serializers.CharField()


class DisponibilidadCanchaSerializer(serializers.Serializer):
    cancha = serializers.IntegerField()
    nombre_cancha = serializers.CharField()
    fecha = serializers.DateField()
    bloques = DisponibilidadBloqueSerializer(many=True)