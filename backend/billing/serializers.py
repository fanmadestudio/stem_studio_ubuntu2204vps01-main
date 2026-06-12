from django.db.models import Sum
from django.db import transaction
from rest_framework import serializers

from billing.models import Invoice, Payment
from billing.services import recalculate_invoice_status


class InvoiceSerializer(serializers.ModelSerializer):
    paid_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ["id", "booking", "total", "status", "issued_at", "paid_amount"]
        read_only_fields = ["id", "issued_at", "paid_amount"]

    def get_paid_amount(self, obj):
        annotated_paid_amount = getattr(obj, "paid_amount", None)
        if annotated_paid_amount is not None:
            return annotated_paid_amount
        return obj.payments.aggregate(total=Sum("amount"))["total"] or 0


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "invoice", "amount", "paid_at", "note"]
        read_only_fields = ["id", "paid_at"]

    def validate(self, attrs):
        invoice = attrs.get("invoice", self.instance.invoice if self.instance else None)
        if invoice and invoice.status == Invoice.InvoiceStatus.CANCELLED:
            raise serializers.ValidationError("Cancelled invoices cannot receive new payments.")
        amount = attrs.get("amount", self.instance.amount if self.instance else None)
        if amount is not None and amount <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            payment = super().create(validated_data)
            recalculate_invoice_status(payment.invoice)
        return payment

    def update(self, instance, validated_data):
        old_invoice = instance.invoice
        with transaction.atomic():
            payment = super().update(instance, validated_data)
            recalculate_invoice_status(payment.invoice)
            if old_invoice.pk != payment.invoice.pk:
                recalculate_invoice_status(old_invoice)
        return payment
