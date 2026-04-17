from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    UserMeView,
    UserProfileUpdateView,
    UserPositionsListCreateView,
    UserPositionDeleteView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", UserMeView.as_view(), name="auth-me"),

    path("users/profile/", UserProfileUpdateView.as_view(), name="user-profile-update"),
    path("users/positions/", UserPositionsListCreateView.as_view(), name="user-positions-list-create"),
    path("users/positions/<int:pk>/", UserPositionDeleteView.as_view(), name="user-position-delete"),
]