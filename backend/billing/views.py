from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from billing.models import Invoice, Payment
from billing.serializers import InvoiceSerializer, PaymentSerializer
from users.permissions import IsAdmin, IsAdminOrStaff


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("booking").prefetch_related("payments").all().order_by("-issued_at")
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrStaff]

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.InvoiceStatus.CANCELLED:
            return Response({"detail": "Cancelled invoice cannot be confirmed."}, status=status.HTTP_400_BAD_REQUEST)

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
    queryset = Payment.objects.select_related("invoice").all().order_by("-paid_at")
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrStaff]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        return [permission() for permission in self.permission_classes]

# Create your views here.
