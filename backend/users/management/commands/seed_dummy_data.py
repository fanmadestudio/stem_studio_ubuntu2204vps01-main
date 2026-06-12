from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from billing.models import Invoice, Payment
from bookings.models import Booking
from clients.models import Client
from notifications.models import Notification
from resources.models import Engineer, Equipment, Room
from users.models import User, UserRole


class Command(BaseCommand):
    help = "Seed sample operational data into the SQLCipher database."

    @transaction.atomic
    def handle(self, *args, **options):
        admin_user, _ = User.objects.update_or_create(
            email="admin@stemstudio.com",
            defaults={
                "username": "",
                "first_name": "Admin",
                "last_name": "Stemstudio",
                "role": UserRole.ADMIN,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("4dm1nst3mstvd10")
        admin_user.save(update_fields=["password"])

        engineer_user, _ = User.objects.update_or_create(
            email="engineer@stemstudio.com",
            defaults={
                "username": "",
                "first_name": "Raka",
                "last_name": "Engineer",
                "role": UserRole.STAFF,
                "is_active": True,
                "is_staff": True,
                "is_superuser": False,
            },
        )
        engineer_user.set_password("Eng1n33rst3m!")
        engineer_user.save(update_fields=["password"])

        client_user, _ = User.objects.update_or_create(
            email="client@stemstudio.com",
            defaults={
                "username": "",
                "first_name": "Maya",
                "last_name": "Client",
                "role": UserRole.CLIENT,
                "is_active": True,
                "is_staff": False,
                "is_superuser": False,
            },
        )
        client_user.set_password("Cl13ntst3m!")
        client_user.save(update_fields=["password"])

        client, _ = Client.objects.update_or_create(
            user=client_user,
            defaults={
                "phone": "+62-812-3456-7890",
                "notes": "Prefers evening sessions and vocal tracking setups.",
            },
        )

        room_a, _ = Room.objects.update_or_create(
            name="Studio A",
            defaults={"price": Decimal("750000.00")},
        )
        room_b, _ = Room.objects.update_or_create(
            name="Studio B",
            defaults={"price": Decimal("450000.00")},
        )

        engineer, _ = Engineer.objects.update_or_create(
            user=engineer_user,
            defaults={
                "name": "Raka Pratama",
                "role": Engineer.EngineerRole.ENGINEER,
                "is_available": True,
            },
        )
        staff_engineer, _ = Engineer.objects.update_or_create(
            name="Dina Ops",
            defaults={
                "user": None,
                "role": Engineer.EngineerRole.STAFF,
                "is_available": True,
            },
        )

        ready_mics, _ = Equipment.objects.update_or_create(
            name="Neumann U87 Pair",
            defaults={"status": Equipment.EquipmentStatus.READY},
        )
        busy_console, _ = Equipment.objects.update_or_create(
            name="SSL Mixing Console",
            defaults={"status": Equipment.EquipmentStatus.BUSY},
        )
        maintenance_headphones, _ = Equipment.objects.update_or_create(
            name="Tracking Headphones Set",
            defaults={"status": Equipment.EquipmentStatus.MAINTENANCE},
        )

        now = timezone.now().replace(minute=0, second=0, microsecond=0)

        booking_one, _ = Booking.objects.update_or_create(
            client=client,
            room=room_a,
            engineer=engineer,
            start_time=now + timedelta(days=1, hours=2),
            defaults={
                "end_time": now + timedelta(days=1, hours=5),
                "notes": "Album vocal tracking session.",
                "status": Booking.BookingStatus.CONFIRMED,
            },
        )
        booking_one.equipment.set([ready_mics, busy_console])

        booking_two, _ = Booking.objects.update_or_create(
            client=client,
            room=room_b,
            engineer=staff_engineer,
            start_time=now - timedelta(days=2, hours=3),
            defaults={
                "end_time": now - timedelta(days=2),
                "notes": "Podcast edit and mixdown.",
                "status": Booking.BookingStatus.COMPLETED,
            },
        )
        booking_two.equipment.set([maintenance_headphones])

        invoice_one, _ = Invoice.objects.update_or_create(
            booking=booking_one,
            defaults={
                "total": Decimal("2250000.00"),
                "status": Invoice.InvoiceStatus.PARTIAL,
            },
        )
        Payment.objects.update_or_create(
            note="Initial booking deposit",
            defaults={
                "invoice": invoice_one,
                "amount": Decimal("1000000.00"),
            },
        )

        invoice_two, _ = Invoice.objects.update_or_create(
            booking=booking_two,
            defaults={
                "total": Decimal("1350000.00"),
                "status": Invoice.InvoiceStatus.PAID,
            },
        )
        Payment.objects.update_or_create(
            note="Paid in full after final export",
            defaults={
                "invoice": invoice_two,
                "amount": Decimal("1350000.00"),
            },
        )

        Notification.objects.update_or_create(
            user=client_user,
            title="Upcoming studio session",
            defaults={
                "message": "Your Studio A recording session is scheduled for tomorrow.",
                "notification_type": Notification.NotificationType.BOOKING_REMINDER,
                "status": Notification.NotificationStatus.PENDING,
                "scheduled_for": now + timedelta(days=1),
            },
        )
        Notification.objects.update_or_create(
            user=admin_user,
            title="Outstanding invoice follow-up",
            defaults={
                "message": "Client deposit received. Final balance is still pending.",
                "notification_type": Notification.NotificationType.PAYMENT_REMINDER,
                "status": Notification.NotificationStatus.SENT,
                "scheduled_for": now,
            },
        )
        Notification.objects.update_or_create(
            user=engineer_user,
            title="Headphones under maintenance",
            defaults={
                "message": "Tracking headphones set is unavailable until inspection is complete.",
                "notification_type": Notification.NotificationType.SYSTEM,
                "status": Notification.NotificationStatus.PENDING,
                "scheduled_for": now + timedelta(hours=4),
            },
        )

        self.stdout.write(self.style.SUCCESS("Dummy data seeded successfully into SQLCipher database."))
