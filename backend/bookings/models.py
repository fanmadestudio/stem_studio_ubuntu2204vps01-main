from django.db import models

from clients.models import Client
from resources.models import Engineer, Equipment, Room


class Booking(models.Model):
    class BookingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="bookings")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="bookings")
    engineer = models.ForeignKey(Engineer, on_delete=models.PROTECT, related_name="bookings")
    equipment = models.ManyToManyField(Equipment, related_name="bookings", blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    notes = models.TextField(max_length=1000, blank=True, default="")
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_time"]

    def __str__(self) -> str:
        return f"{self.client_id} - {self.room.name} ({self.start_time} to {self.end_time})"

# Create your models here.
