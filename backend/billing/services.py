from django.db.models import Sum

from billing.models import Invoice


def recalculate_invoice_status(invoice: Invoice) -> Invoice:
    if invoice.status == Invoice.InvoiceStatus.CANCELLED:
        return invoice
    paid_amount = invoice.payments.aggregate(total=Sum("amount"))["total"] or 0
    if paid_amount >= invoice.total:
        invoice.status = Invoice.InvoiceStatus.PAID
    elif paid_amount > 0:
        invoice.status = Invoice.InvoiceStatus.PARTIAL
    else:
        invoice.status = Invoice.InvoiceStatus.UNPAID
    invoice.save(update_fields=["status"])
    return invoice
