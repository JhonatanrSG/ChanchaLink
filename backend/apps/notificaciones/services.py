from apps.notificaciones.models import Notificacion


def crear_notificacion(
    usuario,
    tipo_notificacion,
    titulo,
    mensaje,
    referencia_id=None,
    referencia_tipo=None
):
    notificacion = Notificacion.objects.create(
        usuario=usuario,
        tipo_notificacion=tipo_notificacion,
        titulo=titulo,
        mensaje=mensaje,
        referencia_id=referencia_id,
        referencia_tipo=referencia_tipo,
    )

    print("\n" + "=" * 70)
    print("[NOTIFICACIÓN DEL SISTEMA]")
    print(f"Usuario: {usuario.email}")
    print(f"Tipo: {tipo_notificacion}")
    print(f"Título: {titulo}")
    print(f"Mensaje: {mensaje}")
    if referencia_tipo and referencia_id:
        print(f"Referencia: {referencia_tipo} #{referencia_id}")
    print("=" * 70 + "\n")

    return notificacion