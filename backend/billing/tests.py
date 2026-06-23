from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from resources.models import Engineer, Room
from users.models import User, UserRole


class BillingStatusTests(TestCase):
    def setUp(self):
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

    def test_payment_create_update_and_delete_recalculate_invoice_status(self):
        payment = Payment.objects.create(invoice=self.invoice, amount=Decimal("100.00"))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.PAID)

        payment.amount = Decimal("30.00")
        payment.save()
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.PARTIAL)

        payment.delete()
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.InvoiceStatus.UNPAID)
