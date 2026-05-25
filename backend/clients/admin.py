from django.contrib import admin

from clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "phone", "created_at"]
    search_fields = ["user__email", "phone"]

# Register your models here.
