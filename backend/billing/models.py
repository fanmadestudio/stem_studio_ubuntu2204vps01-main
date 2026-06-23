from django.db import models
from django.db.models import Sum

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

    @property
    def paid_amount(self):
        return self.payments.aggregate(total=Sum("amount"))["total"] or 0

    @property
    def balance_due(self):
        return self.total - self.paid_amount

    def recalculate_status(self, *, save: bool = True):
        if self.status == self.InvoiceStatus.CANCELLED:
            return self
        paid_amount = self.paid_amount
        if paid_amount >= self.total:
            self.status = self.InvoiceStatus.PAID
        elif paid_amount > 0:
            self.status = self.InvoiceStatus.PARTIAL
        else:
            self.status = self.InvoiceStatus.UNPAID
        if save:
            self.save(update_fields=["status"])
        return self


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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_status()

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        result = super().delete(*args, **kwargs)
        invoice.recalculate_status()
        return result

# Create your models here.
