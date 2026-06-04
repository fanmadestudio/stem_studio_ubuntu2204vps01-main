import calendar
from datetime import datetime
from decimal import Decimal

from django.db.models import Count, Max, Sum
from django.utils import timezone

from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from resources.models import Room


def build_dashboard_payload() -> dict:
    now = timezone.localtime()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    _, last_day = calendar.monthrange(now.year, now.month)
    month_end = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)

    monthly_revenue = (
        Payment.objects.filter(paid_at__range=(month_start, month_end)).aggregate(total=Sum("amount"))["total"]
        or Decimal("0")
    )
    unpaid_invoices = Invoice.objects.exclude(status=Invoice.InvoiceStatus.PAID).count()

    bookings = Booking.objects.filter(start_time__range=(month_start, month_end)).exclude(
        status=Booking.BookingStatus.CANCELLED
    )
    booking_hours = Decimal("0")
    for booking in bookings:
        delta = booking.end_time - booking.start_time
        booking_hours += Decimal(str(delta.total_seconds() / 3600))

    total_rooms = max(Room.objects.count(), 1)
    total_month_hours = Decimal(str(total_rooms * 24 * last_day))
    utilization = int((booking_hours / total_month_hours) * 100) if total_month_hours > 0 else 0

    client_activity = (
        Client.objects.annotate(
            booking_count=Count("bookings"),
            last_booking=Max("bookings__start_time"),
        )
        .order_by("-booking_count", "-last_booking")[:10]
    )

    activity_data = [
        {
            "client_id": client.id,
            "name": f"{client.user.first_name} {client.user.last_name}".strip() or client.user.email,
            "booking_count": client.booking_count,
            "last_booking": client.last_booking.isoformat() if client.last_booking else None,
        }
        for client in client_activity
    ]

    return {
        "period": datetime(now.year, now.month, 1).strftime("%Y-%m"),
        "monthly_revenue": str(monthly_revenue),
        "utilization_percent": utilization,
        "active_clients": Client.objects.count(),
        "unpaid_invoices": unpaid_invoices,
        "client_activity": activity_data,
    }
