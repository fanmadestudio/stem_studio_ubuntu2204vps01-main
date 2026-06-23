from django.contrib.auth import get_user_model
from django.test import TestCase


class AdminOnlyAuthTests(TestCase):
    def setUp(self):
        self.email = "admin-user@example.com"
        self.password = "TestPass12345!"
        self.user = get_user_model().objects.create_superuser(
            email=self.email,
            password=self.password,
        )

    def test_root_redirects_to_admin(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/admin/")

    def test_admin_login_uses_django_session(self):
        logged_in = self.client.login(username=self.email, password=self.password)
        self.assertTrue(logged_in)
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 200)
