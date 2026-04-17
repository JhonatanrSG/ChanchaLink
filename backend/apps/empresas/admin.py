from django.contrib import admin

from .models import Empresa, SoporteEmpresa


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre_empresa",
        "nit",
        "telefono",
        "correo_contacto",
        "activa",
        "fecha_registro",
    )
    search_fields = ("nombre_empresa", "nit", "correo_contacto", "user__email")
    list_filter = ("activa",)


@admin.register(SoporteEmpresa)
class SoporteEmpresaAdmin(admin.ModelAdmin):
    list_display = ("nombre_contacto", "empresa", "cargo", "correo", "telefono", "activo")
    search_fields = ("nombre_contacto", "empresa__nombre_empresa", "correo")
    list_filter = ("activo",)