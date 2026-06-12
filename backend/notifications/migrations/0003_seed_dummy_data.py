import calendar
from datetime import datetime, timedelta

from django.contrib.auth.hashers import make_password
from django.db import migrations
from django.utils import timezone


def seed_dummy_data(apps, schema_editor):
    User = apps.get_model("users", "User")
    Client = apps.get_model("clients", "Client")
    Room = apps.get_model("resources", "Room")
    Engineer = apps.get_model("resources", "Engineer")
    Equipment = apps.get_model("resources", "Equipment")
    Booking = apps.get_model("bookings", "Booking")
    Invoice = apps.get_model("billing", "Invoice")
    Payment = apps.get_model("billing", "Payment")
    Notification = apps.get_model("notifications", "Notification")
    try:
        OutstandingToken = apps.get_model("token_blacklist", "OutstandingToken")
        BlacklistedToken = apps.get_model("token_blacklist", "BlacklistedToken")
    except LookupError:
        OutstandingToken = None
        BlacklistedToken = None

    # Start clean for idempotent seed behavior.
    Payment.objects.all().delete()
    Invoice.objects.all().delete()
    Booking.objects.all().delete()
    Notification.objects.all().delete()
    Client.objects.all().delete()
    Engineer.objects.all().delete()
    Room.objects.all().delete()
    Equipment.objects.all().delete()
    admin_user, _ = User.objects.update_or_create(
        email="admin@stemstudio.com",
        defaults={
            "username": "",
            "role": "admin",
            "first_name": "Admin",
            "last_name": "Stemstudio",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
            "password": make_password("4dm1nst3mstvd10"),
        },
    )

    staff_user, _ = User.objects.update_or_create(
        email="staff@stemstudio.com",
        defaults={
            "username": "",
            "role": "staff",
            "first_name": "Staff",
            "last_name": "Stemstudio",
            "is_staff": True,
            "is_superuser": False,
            "is_active": True,
            "password": make_password("St4ffst3mstvd10"),
        },
    )

    client_user, _ = User.objects.update_or_create(
        email="client.nadya@stemstudio.test",
        defaults={
            "username": "",
            "role": "client",
            "first_name": "Nadya",
            "last_name": "Permata",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
            "password": make_password("DummyPass123!"),
        },
    )

    extra_client_specs = [
        ("client.ayla@stemstudio.test", "Ayla", "Pratama", "+62 812-1111-0001"),
        ("client.gilang@stemstudio.test", "Gilang", "Saputra", "+62 812-1111-0002"),
        ("client.dewi@stemstudio.test", "Dewi", "Lestari", "+62 812-1111-0003"),
        ("client.reza@stemstudio.test", "Reza", "Maulana", "+62 812-1111-0004"),
        ("client.tiara@stemstudio.test", "Tiara", "Anindita", "+62 812-1111-0005"),
        ("client.farhan@stemstudio.test", "Farhan", "Ramadhan", "+62 812-1111-0006"),
        ("client.kirana@stemstudio.test", "Kirana", "Putri", "+62 812-1111-0007"),
        ("client.aditya@stemstudio.test", "Aditya", "Wibowo", "+62 812-1111-0008"),
    ]
    all_clients = [
        Client.objects.create(
            user=client_user,
            phone="+62 812-0000-0000",
            notes="Dummy client for QA and UAT flow testing.",
        )
    ]
    for email, first_name, last_name, phone in extra_client_specs:
        user, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "username": "",
                "role": "client",
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
                "password": make_password("DummyPass123!"),
            },
        )
        all_clients.append(
            Client.objects.create(
                user=user,
                phone=phone,
                notes=f"Dummy profile for {first_name} {last_name}.",
            )
        )

    rooms = [
        Room.objects.create(name="Studio A", price=750000),
        Room.objects.create(name="Studio B", price=500000),
        Room.objects.create(name="Studio C", price=900000),
    ]

    engineers = [
        Engineer.objects.create(name="Raka Engineer", user=staff_user, role="engineer", is_available=True),
        Engineer.objects.create(name="Kevin Engineer", user=None, role="engineer", is_available=True),
        Engineer.objects.create(name="Nadia Engineer", user=None, role="engineer", is_available=False),
    ]
    Engineer.objects.create(name="Sinta Staff", user=None, role="staff", is_available=True)

    equipment_pool = [
        Equipment.objects.create(name="Mic Condenser A", status="ready"),
        Equipment.objects.create(name="Audio Interface B", status="maintenance"),
        Equipment.objects.create(name="Headphone Monitor C", status="busy"),
        Equipment.objects.create(name="Compressor D", status="ready"),
        Equipment.objects.create(name="Preamp E", status="ready"),
        Equipment.objects.create(name="Mixer F", status="ready"),
    ]

    now = timezone.localtime()
    seed_start_year = now.year - 1
    seed_end_year = now.year
    status_cycle = ["completed", "confirmed", "pending", "confirmed", "cancelled"]
    invoice_status_cycle = ["paid", "paid", "partial", "unpaid"]

    month_index = 0
    for year in range(seed_start_year, seed_end_year + 1):
        for month in range(1, 13):
            days_in_month = calendar.monthrange(year, month)[1]
            bookings_in_month = 6 + (month_index % 4)  # 6-9 bookings each month

            for i in range(bookings_in_month):
                client = all_clients[(month_index + i) % len(all_clients)]
                room = rooms[(month_index + i) % len(rooms)]
                engineer = engineers[(month_index + i) % len(engineers)]
                status = status_cycle[(month_index + i) % len(status_cycle)]

                day = min(2 + (i * 3), days_in_month)
                start_hour = 9 + ((i % 3) * 3)  # 09:00, 12:00, 15:00
                duration_hours = 2 + (i % 2)  # 2-3 jam
                naive_start = datetime(year, month, day, start_hour, 0, 0)
                start_time = timezone.make_aware(naive_start, timezone.get_current_timezone())
                end_time = start_time + timedelta(hours=duration_hours)

                booking = Booking.objects.create(
                    client=client,
                    room=room,
                    engineer=engineer,
                    start_time=start_time,
                    end_time=end_time,
                    notes=f"Dummy booking {year}-{month:02d} #{i + 1}.",
                    status=status,
                )
                booking.equipment.add(
                    equipment_pool[(month_index + i) % len(equipment_pool)],
                    equipment_pool[(month_index + i + 1) % len(equipment_pool)],
                )

                if status != "cancelled":
                    invoice_total = room.price * duration_hours
                    invoice_status = invoice_status_cycle[(month_index + i) % len(invoice_status_cycle)]
                    invoice = Invoice.objects.create(
                        booking=booking,
                        total=invoice_total,
                        status=invoice_status,
                    )
                    issued_at = start_time + timedelta(hours=1)
                    Invoice.objects.filter(pk=invoice.pk).update(issued_at=issued_at)

                    if invoice_status == "paid":
                        payment = Payment.objects.create(
                            invoice=invoice,
                            amount=invoice_total,
                            note="Full payment dummy",
                        )
                        Payment.objects.filter(pk=payment.pk).update(paid_at=issued_at + timedelta(hours=2))
                    elif invoice_status == "partial":
                        payment = Payment.objects.create(
                            invoice=invoice,
                            amount=invoice_total / 2,
                            note="DP payment dummy",
                        )
                        Payment.objects.filter(pk=payment.pk).update(paid_at=issued_at + timedelta(hours=1))

            month_index += 1

    for idx, client in enumerate(all_clients):
        Notification.objects.create(
            user=client.user,
            title=f"Reminder Booking #{idx + 1}",
            message="Please check your upcoming studio schedule.",
            notification_type="booking_reminder",
            status="pending",
            scheduled_for=now + timedelta(hours=12 + idx),
        )


def unseed_dummy_data(apps, schema_editor):
    User = apps.get_model("users", "User")
    Client = apps.get_model("clients", "Client")
    Engineer = apps.get_model("resources", "Engineer")
    Room = apps.get_model("resources", "Room")
    Equipment = apps.get_model("resources", "Equipment")
    Booking = apps.get_model("bookings", "Booking")
    Invoice = apps.get_model("billing", "Invoice")
    Payment = apps.get_model("billing", "Payment")
    Notification = apps.get_model("notifications", "Notification")
    try:
        OutstandingToken = apps.get_model("token_blacklist", "OutstandingToken")
        BlacklistedToken = apps.get_model("token_blacklist", "BlacklistedToken")
    except LookupError:
        OutstandingToken = None
        BlacklistedToken = None

    Payment.objects.all().delete()
    Invoice.objects.all().delete()
    Booking.objects.all().delete()
    Notification.objects.all().delete()
    Client.objects.all().delete()
    Engineer.objects.all().delete()
    Room.objects.all().delete()
    Equipment.objects.all().delete()
    if BlacklistedToken is not None:
        BlacklistedToken.objects.all().delete()
    if OutstandingToken is not None:
        OutstandingToken.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_clear_duplicated_usernames"),
        ("clients", "0002_initial"),
        ("resources", "0003_engineer_role"),
        ("bookings", "0004_booking_notes"),
        ("billing", "0003_invoice_cancelled_status"),
        ("notifications", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_dummy_data, unseed_dummy_data),
    ]
