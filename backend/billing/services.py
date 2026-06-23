from billing.models import Invoice


def recalculate_invoice_status(invoice: Invoice) -> Invoice:
    return invoice.recalculate_status()
