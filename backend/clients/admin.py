from django.contrib import admin

from clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["id", "user_email", "phone", "booking_count", "created_at"]
    list_select_related = ["user"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "phone", "notes"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"
    fieldsets = (
        (None, {"fields": ("user", "phone")}),
        ("Internal Notes", {"fields": ("notes",)}),
        ("Audit", {"fields": ("created_at",)}),
    )

    @admin.display(description="Email", ordering="user__email")
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description="Bookings")
    def booking_count(self, obj):
        return obj.bookings.count()

# Register your models here.
