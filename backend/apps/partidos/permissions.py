from rest_framework.permissions import BasePermission


class IsEquipoCreator(BasePermission):
    message = "Solo el creador del equipo puede realizar esta acción."

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and obj.creador == request.user