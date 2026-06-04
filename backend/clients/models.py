from django.db import models

from users.models import User


class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    phone = models.CharField(max_length=30)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.phone}"

# Create your models here.
