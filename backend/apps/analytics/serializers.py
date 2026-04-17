from rest_framework import serializers


class DashboardResumenSerializer(serializers.Serializer):
    total_reservas = serializers.IntegerField()
    total_partidos_creados = serializers.IntegerField()
    total_postulaciones = serializers.IntegerField()
    total_equipos = serializers.IntegerField()


class DashboardReservaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cancha_nombre = serializers.CharField()
    fecha_reserva = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    estado_reserva = serializers.CharField()
    precio_final = serializers.DecimalField(max_digits=10, decimal_places=2)


class DashboardPartidoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cancha_nombre = serializers.CharField()
    fecha_reserva = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    estado_partido = serializers.CharField()
    tipo_partido = serializers.CharField()
    nivel_partido = serializers.CharField()
    jugadores_faltantes = serializers.IntegerField()


class DashboardPostulacionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    partido_id = serializers.IntegerField()
    cancha_nombre = serializers.CharField()
    fecha_reserva = serializers.DateField()
    estado_postulacion = serializers.CharField()
    posicion_postulada = serializers.CharField(allow_null=True)
    fecha_postulacion = serializers.DateTimeField()


class DashboardEquipoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre_equipo = serializers.CharField()
    rol_equipo = serializers.CharField()
    activo = serializers.BooleanField()


class UserDashboardSerializer(serializers.Serializer):
    resumen = DashboardResumenSerializer()
    proximas_reservas = DashboardReservaSerializer(many=True)
    mis_partidos = DashboardPartidoSerializer(many=True)
    mis_postulaciones = DashboardPostulacionSerializer(many=True)
    mis_equipos = DashboardEquipoSerializer(many=True)

class EmpresaDashboardResumenSerializer(serializers.Serializer):
    total_canchas = serializers.IntegerField()
    reservas_activas = serializers.IntegerField()
    reservas_hoy = serializers.IntegerField()
    ingresos_hoy = serializers.DecimalField(max_digits=12, decimal_places=2)
    partidos_activos = serializers.IntegerField()


class EmpresaDashboardCanchaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    tipo_futbol = serializers.CharField()
    estado_operativo = serializers.CharField()
    activa = serializers.BooleanField()
    imagen = serializers.CharField(allow_null=True, required=False)


class EmpresaDashboardReservaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cancha_nombre = serializers.CharField()
    fecha_reserva = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    estado_reserva = serializers.CharField()
    precio_final = serializers.DecimalField(max_digits=10, decimal_places=2)
    usuario_email = serializers.CharField(allow_null=True)
    nombre_contacto = serializers.CharField(allow_null=True)


class EmpresaDashboardSerializer(serializers.Serializer):
    resumen = EmpresaDashboardResumenSerializer()
    canchas = EmpresaDashboardCanchaSerializer(many=True)
    ultimas_reservas = EmpresaDashboardReservaSerializer(many=True)


class EmpresaEstadisticaSerieSerializer(serializers.Serializer):
    label = serializers.CharField()
    reservas = serializers.IntegerField()
    ingresos = serializers.DecimalField(max_digits=12, decimal_places=2)


class EmpresaIngresoPorCanchaSerializer(serializers.Serializer):
    cancha_id = serializers.IntegerField()
    cancha_nombre = serializers.CharField()
    ingresos = serializers.DecimalField(max_digits=12, decimal_places=2)
    reservas = serializers.IntegerField()


class EmpresaEstadisticasSerializer(serializers.Serializer):
    periodo = serializers.CharField()
    total_reservas = serializers.IntegerField()
    total_ingresos = serializers.DecimalField(max_digits=12, decimal_places=2)
    serie = EmpresaEstadisticaSerieSerializer(many=True)
    ingresos_por_cancha = EmpresaIngresoPorCanchaSerializer(many=True)