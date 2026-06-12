from django.db import models

from bookings.models import Booking


class Invoice(models.Model):
    class InvoiceStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="invoice")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["issued_at"]),
            models.Index(fields=["issued_at", "status"]),
        ]

    def __str__(self) -> str:
        return f"Invoice {self.id} - Booking {self.booking_id}"


class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["invoice", "paid_at"]),
            models.Index(fields=["paid_at"]),
        ]

    def __str__(self) -> str:
        return f"Payment {self.id} - Invoice {self.invoice_id}"

# Create your models here.
