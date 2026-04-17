from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El correo electrónico es obligatorio")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("rol", User.Rol.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Rol(models.TextChoices):
        JUGADOR = "jugador", "Jugador"
        EMPRESA = "empresa", "Empresa"
        ADMIN = "admin", "Administrador"

    class EstadoCuenta(models.TextChoices):
        ACTIVA = "activa", "Activa"
        INACTIVA = "inactiva", "Inactiva"
        SUSPENDIDA = "suspendida", "Suspendida"

    email = models.EmailField(unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    numero_celular = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    sexo = models.CharField(max_length=20, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to="usuarios/perfiles/", blank=True, null=True)

    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.JUGADOR,
    )

    estado_cuenta = models.CharField(
        max_length=20,
        choices=EstadoCuenta.choices,
        default=EstadoCuenta.ACTIVA,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombres", "apellidos"]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.email} - {self.rol}"


class PerfilJugador(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil_jugador"
    )
    nivel_actual = models.PositiveSmallIntegerField(default=1)
    partidos_confirmados = models.PositiveIntegerField(default=0)
    reputacion = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Perfil de jugador"
        verbose_name_plural = "Perfiles de jugador"

    def __str__(self):
        return f"Perfil jugador - {self.user.email}"


class PosicionJugador(models.Model):
    class NombrePosicion(models.TextChoices):
        ARQUERO = "arquero", "Arquero"
        DEFENSA = "defensa", "Defensa"
        MEDIO = "medio", "Medio"
        DELANTERO = "delantero", "Delantero"

    perfil_jugador = models.ForeignKey(
        PerfilJugador,
        on_delete=models.CASCADE,
        related_name="posiciones"
    )
    nombre_posicion = models.CharField(
        max_length=20,
        choices=NombrePosicion.choices
    )
    principal = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Posición del jugador"
        verbose_name_plural = "Posiciones del jugador"
        constraints = [
            models.UniqueConstraint(
                fields=["perfil_jugador", "nombre_posicion"],
                name="unique_posicion_por_perfil"
            )
        ]

    def __str__(self):
        tipo = "Principal" if self.principal else "Secundaria"
        return f"{self.perfil_jugador.user.email} - {self.nombre_posicion} ({tipo})"


class HistorialNivelJugador(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="historial_niveles"
    )
    nivel_anterior = models.PositiveSmallIntegerField()
    nivel_nuevo = models.PositiveSmallIntegerField()
    partidos_acumulados = models.PositiveIntegerField(default=0)
    fecha_cambio = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historial de nivel del jugador"
        verbose_name_plural = "Historial de niveles del jugador"
        ordering = ["-fecha_cambio"]

    def __str__(self):
        return f"{self.user.email} | {self.nivel_anterior} -> {self.nivel_nuevo}"