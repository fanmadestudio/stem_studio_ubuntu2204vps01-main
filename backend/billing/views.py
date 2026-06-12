from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum

from billing.models import Invoice, Payment
from billing.services import recalculate_invoice_status
from billing.serializers import InvoiceSerializer, PaymentSerializer
from users.permissions import IsAdmin, IsAdminOrStaff


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        queryset = (
            Invoice.objects.select_related("booking", "booking__client__user", "booking__room", "booking__engineer")
            .annotate(paid_amount=Sum("payments__amount"))
            .all()
            .order_by("-id")
        )

        booking_id = self.request.query_params.get("booking")
        status = self.request.query_params.get("status")
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")

        if booking_id and booking_id.isdigit():
            queryset = queryset.filter(booking_id=int(booking_id))
        if status:
            queryset = queryset.filter(status=status)
        if year and year.isdigit():
            queryset = queryset.filter(issued_at__year=int(year))
        if month and month.isdigit():
            month_int = int(month)
            if 1 <= month_int <= 12:
                queryset = queryset.filter(issued_at__month=month_int)

        return queryset

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.InvoiceStatus.CANCELLED:
            return Response({"detail": "Cancelled invoice cannot be confirmed."}, status=status.HTTP_400_BAD_REQUEST)
        paid_amount = getattr(invoice, "paid_amount", None)
        if paid_amount is None:
            paid_amount = invoice.payments.aggregate(total=Sum("amount"))["total"] or 0
        if paid_amount < invoice.total:
            return Response(
                {"detail": "Invoice cannot be confirmed before full payment is received."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice.status = Invoice.InvoiceStatus.PAID
        invoice.save(update_fields=["status"])
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.InvoiceStatus.PAID:
            return Response(
                {"detail": "Paid invoice cannot be cancelled directly. Process refund first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = invoice.booking
        booking.status = booking.BookingStatus.CANCELLED
        booking.save(update_fields=["status"])

        invoice.status = Invoice.InvoiceStatus.CANCELLED
        invoice.save(update_fields=["status"])
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        queryset = Payment.objects.select_related("invoice").all().order_by("-paid_at")
        invoice_id = self.request.query_params.get("invoice")
        if invoice_id and invoice_id.isdigit():
            queryset = queryset.filter(invoice_id=int(invoice_id))
        return queryset

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        return [permission() for permission in self.permission_classes]

    def perform_destroy(self, instance):
        invoice = instance.invoice
        with transaction.atomic():
            super().perform_destroy(instance)
            recalculate_invoice_status(invoice)

# Create your views here.
