import json

from django.contrib.auth import get_user_model
from django.test import TestCase


class SessionAuthTests(TestCase):
    def setUp(self):
        self.client.enforce_csrf_checks = True
        self.email = "session-user@example.com"
        self.password = "TestPass12345!"
        self.user = get_user_model().objects.create_user(
            email=self.email,
            password=self.password,
            first_name="Session",
            last_name="User",
            role="admin",
        )

    def test_login_me_and_logout_use_django_session(self):
        csrf_response = self.client.get("/api/v1/auth/csrf/")
        self.assertEqual(csrf_response.status_code, 200)
        login_csrf_token = self.client.cookies["csrftoken"].value

        login_response = self.client.post(
            "/api/v1/auth/login/",
            data=json.dumps({"email": self.email, "password": self.password}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=login_csrf_token,
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.json()["email"], self.email)

        me_response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["email"], self.email)

        logout_csrf_token = self.client.cookies["csrftoken"].value
        logout_response = self.client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=logout_csrf_token)
        self.assertEqual(logout_response.status_code, 204)

        after_logout_response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(after_logout_response.status_code, 403)
