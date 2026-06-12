import calendar
from datetime import datetime
from decimal import Decimal

from django.db.models import Count, DurationField, ExpressionWrapper, F, Max, Min, Sum
from django.db.models.functions import ExtractMonth, ExtractYear
from django.utils import timezone

from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from resources.models import Engineer, Room


def build_dashboard_payload() -> dict:
    now = timezone.localtime()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    _, last_day = calendar.monthrange(now.year, now.month)
    month_end = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)

    monthly_revenue = (
        Payment.objects.filter(paid_at__range=(month_start, month_end)).aggregate(total=Sum("amount"))["total"]
        or Decimal("0")
    )
    yearly_revenue = Payment.objects.filter(paid_at__range=(year_start, now)).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    total_revenue = Payment.objects.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    unpaid_invoices = Invoice.objects.exclude(status=Invoice.InvoiceStatus.PAID).count()
    total_invoices = Invoice.objects.count()
    paid_invoices = Invoice.objects.filter(status=Invoice.InvoiceStatus.PAID).count()
    pending_bookings = Booking.objects.filter(status=Booking.BookingStatus.PENDING).count()
    todays_bookings = Booking.objects.filter(start_time__date=now.date()).count()
    total_engineers = Engineer.objects.filter(role=Engineer.EngineerRole.ENGINEER).count()
    available_engineers = Engineer.objects.filter(role=Engineer.EngineerRole.ENGINEER, is_available=True).count()

    booking_duration = (
        Booking.objects.filter(start_time__range=(month_start, month_end))
        .exclude(status=Booking.BookingStatus.CANCELLED)
        .annotate(duration=ExpressionWrapper(F("end_time") - F("start_time"), output_field=DurationField()))
        .aggregate(total=Sum("duration"))["total"]
    )
    booking_hours = Decimal(str((booking_duration.total_seconds() / 3600) if booking_duration else 0))

    total_rooms = max(Room.objects.count(), 1)
    total_month_hours = Decimal(str(total_rooms * 24 * last_day))
    utilization = int((booking_hours / total_month_hours) * 100) if total_month_hours > 0 else 0

    client_activity = (
        Client.objects.annotate(
            booking_count=Count("bookings"),
            last_booking=Max("bookings__start_time"),
        )
        .select_related("user")
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
        "yearly_revenue": str(yearly_revenue),
        "total_revenue": str(total_revenue),
        "utilization_percent": utilization,
        "active_clients": Client.objects.count(),
        "unpaid_invoices": unpaid_invoices,
        "total_invoices": total_invoices,
        "paid_invoices": paid_invoices,
        "pending_bookings": pending_bookings,
        "todays_bookings": todays_bookings,
        "available_engineers": available_engineers,
        "total_engineers": total_engineers,
        "client_activity": activity_data,
    }


def build_monthly_invoice_summary(year: int) -> dict:
    base = {month: {"total": 0, "paid": 0, "unpaid": 0, "cancelled": 0, "revenue": Decimal("0")} for month in range(1, 13)}
    aggregates = (
        Invoice.objects.filter(issued_at__year=year)
        .values("issued_at__month", "status")
        .annotate(total_invoices=Count("id"), total_revenue=Sum("total"))
    )

    for row in aggregates:
        month = row["issued_at__month"]
        status = row["status"]
        month_bucket = base.get(month)
        if not month_bucket:
            continue
        month_bucket["total"] += row["total_invoices"] or 0
        month_bucket["revenue"] += row["total_revenue"] or Decimal("0")
        if status == Invoice.InvoiceStatus.PAID:
            month_bucket["paid"] += row["total_invoices"] or 0
        elif status == Invoice.InvoiceStatus.CANCELLED:
            month_bucket["cancelled"] += row["total_invoices"] or 0
        else:
            month_bucket["unpaid"] += row["total_invoices"] or 0

    rows = [
        {
            "month": month,
            "total_invoices": data["total"],
            "paid_invoices": data["paid"],
            "unpaid_invoices": data["unpaid"],
            "cancelled_invoices": data["cancelled"],
            "total_revenue": str(data["revenue"]),
        }
        for month, data in base.items()
    ]
    yearly_total = str(sum((row_data["revenue"] for row_data in base.values()), Decimal("0")))
    return {"year": year, "rows": rows, "yearly_total": yearly_total}


def build_invoice_date_range() -> dict:
    span = Invoice.objects.aggregate(oldest=Min("issued_at"), newest=Max("issued_at"))
    oldest = span["oldest"]
    newest = span["newest"]
    return {
        "oldest_issued_at": oldest.isoformat() if oldest else None,
        "newest_issued_at": newest.isoformat() if newest else None,
    }


def build_dashboard_trends(months: int = 12) -> dict:
    now = timezone.localtime()
    def shift_month(dt, delta):
        month_index = dt.month - 1 + delta
        year = dt.year + (month_index // 12)
        month = (month_index % 12) + 1
        return dt.replace(year=year, month=month)

    month_starts = []
    for idx in range(months):
        d = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        d = shift_month(d, -(months - idx - 1))
        month_starts.append(d)

    start_window = month_starts[0]
    invoices = (
        Invoice.objects.filter(issued_at__gte=start_window)
        .annotate(year=ExtractYear("issued_at"), month=ExtractMonth("issued_at"))
        .values("year", "month")
        .annotate(total=Sum("total"))
    )
    bookings = (
        Booking.objects.filter(start_time__gte=start_window)
        .annotate(year=ExtractYear("start_time"), month=ExtractMonth("start_time"))
        .values("year", "month")
        .annotate(total=Count("id"))
    )
    revenue_map = {(row["year"], row["month"]): float(row["total"] or 0) for row in invoices}
    booking_map = {(row["year"], row["month"]): int(row["total"] or 0) for row in bookings}

    labels = [d.strftime("%b %y") for d in month_starts]
    revenue_trend = [revenue_map.get((d.year, d.month), 0) for d in month_starts]
    bookings_trend = [booking_map.get((d.year, d.month), 0) for d in month_starts]
    return {
        "labels": labels,
        "revenue_trend": revenue_trend,
        "bookings_trend": bookings_trend,
    }
