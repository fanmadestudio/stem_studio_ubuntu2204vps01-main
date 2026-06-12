from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from resources.models import Engineer, Room
from users.models import User, UserRole


class BillingApiRegressionTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="StrongPass123!",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.client.force_authenticate(self.admin)

        client_user = User.objects.create_user(email="client@test.com", password="StrongPass123!", role=UserRole.CLIENT)
        client = Client.objects.create(user=client_user, phone="0800000000", notes="")
        engineer = Engineer.objects.create(name="Eng A")
        room = Room.objects.create(name="Room A", price=Decimal("100.00"))

        booking = Booking.objects.create(
            client=client,
            room=room,
            engineer=engineer,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
        )
        self.invoice = Invoice.objects.create(booking=booking, total=Decimal("100.00"), status=Invoice.InvoiceStatus.UNPAID)

    def test_confirm_invoice_rejects_if_not_fully_paid(self):
        url = reverse("invoice-confirm", args=[self.invoice.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.UNPAID)

    def test_payment_delete_recalculates_invoice_status(self):
        create_url = reverse("payment-list")
        create_resp = self.client.post(create_url, {"invoice": self.invoice.id, "amount": "100.00", "note": ""}, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.PAID)

        created_payment_id = create_resp.data["id"]
        delete_resp = self.client.delete(reverse("payment-detail", args=[created_payment_id]))
        self.assertEqual(delete_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.UNPAID)

    def test_payment_update_recalculates_invoice_status(self):
        payment = Payment.objects.create(invoice=self.invoice, amount=Decimal("100.00"))

        update_url = reverse("payment-detail", args=[payment.id])
        response = self.client.patch(update_url, {"amount": "30.00"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.PARTIAL)
