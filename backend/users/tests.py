from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class DjangoAuthTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="admin@stemstudio.com",
            password="Adm1npassword!",
            first_name="Stem",
            last_name="Admin",
            role="admin",
        )

    def test_login_returns_bearer_token(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "admin@stemstudio.com", "password": "Adm1npassword!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)
        self.assertTrue(Token.objects.filter(user=self.user, key=response.data["token"]).exists())

    def test_profile_accepts_bearer_token(self):
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.key}")

        response = self.client.get("/api/v1/auth/profile/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.user.email)
