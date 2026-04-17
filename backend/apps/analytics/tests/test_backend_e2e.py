from django.test import TestCase
from rest_framework.test import APIClient


class BackendE2ETest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = "/api"

        self.user_data = {
            "email": "testuser@canchalink.com",
            "password": "Test1234!",
            "nombres": "Test",
            "apellidos": "User",
            "numero_celular": "3001234567",
            "fecha_nacimiento": "2000-01-01",
            "sexo": "masculino",
            "rol": "jugador",
        }

    def test_full_flow(self):
        print("\\n===== INICIO PRUEBAS BACKEND =====")

        # Registro
        res = self.client.post(
            f"{self.base_url}/auth/register/",
            self.user_data,
            format="json"
        )
        print("Registro:", res.status_code, getattr(res, "data", None))
        self.assertIn(res.status_code, [200, 201])

        # Login
        res = self.client.post(
            f"{self.base_url}/auth/login/",
            {
                "email": self.user_data["email"],
                "password": self.user_data["password"]
            },
            format="json"
        )
        print("Login:", res.status_code, getattr(res, "data", None))
        self.assertEqual(res.status_code, 200)

        token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Me
        res = self.client.get(f"{self.base_url}/auth/me/")
        print("Me:", res.status_code, getattr(res, "data", None))
        self.assertEqual(res.status_code, 200)

        # Dashboard usuario
        res = self.client.get(f"{self.base_url}/users/dashboard/")
        print("Dashboard usuario:", res.status_code, getattr(res, "data", None))
        self.assertEqual(res.status_code, 200)

        print("===== FIN PRUEBAS =====")