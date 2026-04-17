from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.empresas.urls")),
    path("api/", include("apps.canchas.urls")),
    path("api/", include("apps.reservas.urls")),
    path("api/", include("apps.equipos.urls")),
    path("api/", include("apps.partidos.urls")),
    path("api/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)