from django.db import models

from users.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BOOKING_REMINDER = "booking_reminder", "Booking Reminder"
        PAYMENT_REMINDER = "payment_reminder", "Payment Reminder"
        SYSTEM = "system", "System"

    class NotificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=120)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    status = models.CharField(max_length=20, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"

# Create your models here.
