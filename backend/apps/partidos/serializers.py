from rest_framework import serializers

from .models import Partido, PartidoPosicionNecesaria, PostulacionPartido


class PartidoPosicionNecesariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartidoPosicionNecesaria
        fields = (
            "id",
            "posicion",
            "cantidad",
        )


class PostulacionPartidoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = PostulacionPartido
        fields = (
            "id",
            "partido",
            "usuario",
            "usuario_email",
            "usuario_nombre",
            "posicion_postulada",
            "nota",
            "estado_postulacion",
            "fecha_postulacion",
            "fecha_respuesta",
        )
        read_only_fields = (
            "id",
            "usuario",
            "estado_postulacion",
            "fecha_postulacion",
            "fecha_respuesta",
        )

    def get_usuario_nombre(self, obj):
        return f"{obj.usuario.nombres} {obj.usuario.apellidos}"


class PartidoSerializer(serializers.ModelSerializer):
    usuario_creador_email = serializers.CharField(source="usuario_creador.email", read_only=True)
    cancha_nombre = serializers.CharField(source="reserva.cancha.nombre", read_only=True)
    empresa_nombre = serializers.CharField(source="reserva.cancha.empresa.nombre_empresa", read_only=True)
    cancha_imagen = serializers.ImageField(source="reserva.cancha.imagen", read_only=True)
    cancha_ubicacion = serializers.CharField(source="reserva.cancha.ubicacion", read_only=True)
    cancha_tipo_futbol = serializers.CharField(source="reserva.cancha.tipo_futbol", read_only=True)
    fecha_reserva = serializers.DateField(source="reserva.fecha_reserva", read_only=True)
    hora_inicio = serializers.TimeField(source="reserva.hora_inicio", read_only=True)
    hora_fin = serializers.TimeField(source="reserva.hora_fin", read_only=True)
    posiciones_necesarias = PartidoPosicionNecesariaSerializer(many=True, read_only=True)

    class Meta:
        model = Partido
        fields = (
            "id",
            "reserva",
            "usuario_creador",
            "usuario_creador_email",
            "equipo",
            "tipo_partido",
            "nivel_partido",
            "descripcion",
            "jugadores_faltantes",
            "jugadores_actuales",
            "maximo_jugadores",
            "estado_partido",
            "fecha_publicacion",
            "fecha_vencimiento",
            "cancha_nombre",
            "empresa_nombre",
            "cancha_imagen",
            "cancha_ubicacion",
            "cancha_tipo_futbol",
            "fecha_reserva",
            "hora_inicio",
            "hora_fin",
            "posiciones_necesarias",
        )
        read_only_fields = (
            "id",
            "usuario_creador",
            "usuario_creador_email",
            "fecha_publicacion",
            "cancha_nombre",
            "empresa_nombre",
            "cancha_imagen",
            "cancha_ubicacion",
            "cancha_tipo_futbol",
            "fecha_reserva",
            "hora_inicio",
            "hora_fin",
            "posiciones_necesarias",
        )

    def validate(self, attrs):
        reserva = attrs.get("reserva", getattr(self.instance, "reserva", None))
        usuario = self.context["request"].user

        if reserva.usuario != usuario:
            raise serializers.ValidationError("Solo puedes publicar partidos sobre reservas propias.")

        if reserva.estado_reserva != reserva.EstadoReserva.CONFIRMADA:
            raise serializers.ValidationError("Solo se pueden publicar partidos con reservas confirmadas.")

        return attrs


class PartidoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partido
        fields = (
            "reserva",
            "equipo",
            "tipo_partido",
            "nivel_partido",
            "descripcion",
            "jugadores_faltantes",
            "jugadores_actuales",
            "maximo_jugadores",
            "estado_partido",
            "fecha_vencimiento",
        )

    def validate(self, attrs):
        reserva = attrs.get("reserva", getattr(self.instance, "reserva", None))
        usuario = self.context["request"].user

        if reserva.usuario != usuario:
            raise serializers.ValidationError("Solo puedes publicar partidos sobre reservas propias.")

        if reserva.estado_reserva != reserva.EstadoReserva.CONFIRMADA:
            raise serializers.ValidationError("Solo se pueden publicar partidos con reservas confirmadas.")

        return attrs


class PostulacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostulacionPartido
        fields = (
            "posicion_postulada",
            "nota",
        )