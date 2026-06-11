from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.test import TestCase
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


class SeedCredentialsCommandTests(TestCase):
    def test_seed_credentials_creates_admin_and_staff_users(self):
        call_command("seed_credentials")

        user_model = get_user_model()
        admin = user_model.objects.get(email="admin@stemstudio.com")
        staff = user_model.objects.get(email="staff@stemstudio.com")

        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.check_password("4dm1nst3mstvd10"))

        self.assertEqual(staff.role, "staff")
        self.assertTrue(staff.is_staff)
        self.assertFalse(staff.is_superuser)
        self.assertTrue(staff.check_password("St4ffst3mstvd10"))
