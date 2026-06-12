from django.core.management.base import BaseCommand
from django.db import transaction

from bookings.models import Booking
from clients.models import Client
from notifications.models import Notification
from resources.models import Engineer, Equipment, Room
from users.models import User


class Command(BaseCommand):
    help = "Remove dummy data created by seed_dummy_data."

    @transaction.atomic
    def handle(self, *args, **options):
        Notification.objects.filter(
            title__in=[
                "Upcoming studio session",
                "Outstanding invoice follow-up",
                "Headphones under maintenance",
            ]
        ).delete()

        Booking.objects.filter(
            notes__in=["Album vocal tracking session.", "Podcast edit and mixdown."]
        ).delete()
        Client.objects.filter(notes="Prefers evening sessions and vocal tracking setups.").delete()
        Engineer.objects.filter(name__in=["Raka Pratama", "Dina Ops"]).delete()
        Equipment.objects.filter(
            name__in=["Neumann U87 Pair", "SSL Mixing Console", "Tracking Headphones Set"]
        ).delete()
        Room.objects.filter(name__in=["Studio A", "Studio B"]).delete()
        User.objects.filter(
            email__in=["admin@stemstudio.com", "engineer@stemstudio.com", "client@stemstudio.com"]
        ).delete()

        self.stdout.write(self.style.SUCCESS("Dummy data removed successfully."))
