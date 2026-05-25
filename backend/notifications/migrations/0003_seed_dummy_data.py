from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.db import migrations
from django.utils import timezone


DUMMY_EMAILS = [
    "admin@stemstudio.com",
    "staff@stemstudio.com",
    "client.dummy@stemstudio.test",
    "client.ayla@stemstudio.test",
    "client.nero@stemstudio.test",
    "client.bima@stemstudio.test",
    "client.raka@stemstudio.test",
    "client.salsa@stemstudio.test",
]


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
        email="client.dummy@stemstudio.test",
        defaults={
            "username": "",
            "role": "client",
            "first_name": "Client",
            "last_name": "Dummy",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
            "password": make_password("DummyPass123!"),
        },
    )

    extra_client_specs = [
        ("client.ayla@stemstudio.test", "Ayla", "Pratama", "+62 812-1111-0001"),
        ("client.nero@stemstudio.test", "Nero", "Studio", "+62 812-1111-0002"),
        ("client.bima@stemstudio.test", "Bima", "Orchestra", "+62 812-1111-0003"),
        ("client.raka@stemstudio.test", "Raka", "Band", "+62 812-1111-0004"),
        ("client.salsa@stemstudio.test", "Salsa", "Voice", "+62 812-1111-0005"),
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

    now = timezone.now()
    status_cycle = ["completed", "confirmed", "pending", "cancelled"]
    invoice_status_cycle = ["paid", "partial", "unpaid"]

    for week in range(52):
        for slot in range(2):
            status = status_cycle[(week + slot) % len(status_cycle)]
            client = all_clients[(week + slot) % len(all_clients)]
            room = rooms[(week + slot) % len(rooms)]
            engineer = engineers[(week + slot) % len(engineers)]

            days_back = (51 - week) * 7
            start_time = now - timedelta(days=days_back) + timedelta(hours=9 + (slot * 4))
            end_time = start_time + timedelta(hours=2 + (slot % 2))
            booking = Booking.objects.create(
                client=client,
                room=room,
                engineer=engineer,
                start_time=start_time,
                end_time=end_time,
                notes=f"Dummy booking week {week + 1}, slot {slot + 1}.",
                status=status,
            )
            booking.equipment.add(
                equipment_pool[(week + slot) % len(equipment_pool)],
                equipment_pool[(week + slot + 1) % len(equipment_pool)],
            )

            if status != "cancelled":
                invoice_total = room.price * (2 + (slot % 2))
                invoice_status = invoice_status_cycle[(week + slot) % len(invoice_status_cycle)]
                invoice = Invoice.objects.create(
                    booking=booking,
                    total=invoice_total,
                    status=invoice_status,
                )
                # Spread invoice dates so trends are not flat.
                Invoice.objects.filter(pk=invoice.pk).update(issued_at=start_time + timedelta(hours=1))

                if invoice_status == "paid":
                    payment = Payment.objects.create(
                        invoice=invoice,
                        amount=invoice_total,
                        note="Full payment dummy",
                    )
                    Payment.objects.filter(pk=payment.pk).update(paid_at=start_time + timedelta(hours=3))
                elif invoice_status == "partial":
                    payment = Payment.objects.create(
                        invoice=invoice,
                        amount=invoice_total / 2,
                        note="DP payment dummy",
                    )
                    Payment.objects.filter(pk=payment.pk).update(paid_at=start_time + timedelta(hours=2))

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
