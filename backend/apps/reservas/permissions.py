from rest_framework.permissions import BasePermission
from apps.users.models import User


class IsEmpresaUser(BasePermission):
    message = "Solo los usuarios con rol empresa pueden realizar esta acción."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.rol == User.Rol.EMPRESA