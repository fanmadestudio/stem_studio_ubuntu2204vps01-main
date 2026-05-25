from django.db.models import Sum
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
        return obj.payments.aggregate(total=Sum("amount"))["total"] or 0


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "invoice", "amount", "paid_at", "note"]
        read_only_fields = ["id", "paid_at"]

    def validate(self, attrs):
        invoice = attrs.get("invoice")
        if invoice and invoice.status == Invoice.InvoiceStatus.CANCELLED:
            raise serializers.ValidationError("Cancelled invoices cannot receive new payments.")
        return attrs

    def create(self, validated_data):
        payment = super().create(validated_data)
        recalculate_invoice_status(payment.invoice)
        return payment
