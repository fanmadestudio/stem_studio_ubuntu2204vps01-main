from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from notifications.models import Notification
from resources.models import Engineer, Equipment, Room


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


class SeedDummyDataCommandTests(TestCase):
    def test_seed_dummy_data_creates_sample_records(self):
        call_command("seed_dummy_data")

        user_model = get_user_model()
        admin = user_model.objects.get(email="admin@stemstudio.com")
        engineer_user = user_model.objects.get(email="engineer@stemstudio.com")
        client_user = user_model.objects.get(email="client@stemstudio.com")

        self.assertEqual(admin.role, "admin")
        self.assertEqual(engineer_user.role, "staff")
        self.assertEqual(client_user.role, "client")

        self.assertEqual(Client.objects.count(), 1)
        self.assertEqual(Room.objects.count(), 2)
        self.assertEqual(Engineer.objects.count(), 2)
        self.assertEqual(Equipment.objects.count(), 3)
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(Invoice.objects.count(), 2)
        self.assertEqual(Payment.objects.count(), 2)
        self.assertEqual(Notification.objects.count(), 3)

    def test_seed_dummy_data_is_idempotent(self):
        call_command("seed_dummy_data")
        call_command("seed_dummy_data")

        self.assertEqual(get_user_model().objects.filter(email="client@stemstudio.com").count(), 1)
        self.assertEqual(Client.objects.count(), 1)
        self.assertEqual(Room.objects.count(), 2)
        self.assertEqual(Engineer.objects.count(), 2)
        self.assertEqual(Equipment.objects.count(), 3)
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(Invoice.objects.count(), 2)
        self.assertEqual(Payment.objects.count(), 2)
        self.assertEqual(Notification.objects.count(), 3)

    def test_reset_dummy_data_removes_seeded_records(self):
        call_command("seed_dummy_data")
        call_command("reset_dummy_data")

        self.assertFalse(get_user_model().objects.filter(email="client@stemstudio.com").exists())
        self.assertEqual(Client.objects.count(), 0)
        self.assertEqual(Room.objects.count(), 0)
        self.assertEqual(Engineer.objects.count(), 0)
        self.assertEqual(Equipment.objects.count(), 0)
        self.assertEqual(Booking.objects.count(), 0)
        self.assertEqual(Invoice.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(Notification.objects.count(), 0)
