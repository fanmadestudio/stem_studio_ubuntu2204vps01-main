from django.db import models

from users.models import User


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return self.name


class Engineer(models.Model):
    class EngineerRole(models.TextChoices):
        ENGINEER = "engineer", "Engineer"
        STAFF = "staff", "Staff"

    name = models.CharField(max_length=120)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="engineer_profile")
    role = models.CharField(max_length=20, choices=EngineerRole.choices, default=EngineerRole.ENGINEER)
    is_available = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class Equipment(models.Model):
    class EquipmentStatus(models.TextChoices):
        READY = "ready", "Ready"
        MAINTENANCE = "maintenance", "Maintenance"
        BUSY = "busy", "Busy"

    name = models.CharField(max_length=120, unique=True)
    status = models.CharField(max_length=20, choices=EquipmentStatus.choices, default=EquipmentStatus.READY)

    def __str__(self) -> str:
        return self.name

# Create your models here.
