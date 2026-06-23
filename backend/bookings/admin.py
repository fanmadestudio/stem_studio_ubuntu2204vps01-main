from django.contrib import admin

from bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "room", "engineer", "start_time", "end_time", "status", "invoice_status"]
    list_filter = ["status", "room", "engineer", "start_time"]
    search_fields = [
        "client__user__email",
        "client__user__first_name",
        "client__user__last_name",
        "room__name",
        "engineer__name",
        "notes",
    ]
    ordering = ["-start_time"]
    readonly_fields = ["created_at", "invoice_status"]
    date_hierarchy = "start_time"
    filter_horizontal = ["equipment"]
    actions = ["mark_confirmed", "mark_completed", "mark_cancelled"]
    fieldsets = (
        (None, {"fields": ("client", "room", "engineer", "equipment")}),
        ("Schedule", {"fields": ("start_time", "end_time", "status")}),
        ("Notes", {"fields": ("notes",)}),
        ("Audit", {"fields": ("created_at", "invoice_status")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("client__user", "room", "engineer").prefetch_related("equipment")

    @admin.action(description="Mark selected bookings as confirmed")
    def mark_confirmed(self, request, queryset):
        updated = queryset.update(status=Booking.BookingStatus.CONFIRMED)
        self.message_user(request, f"{updated} booking(s) marked confirmed.")

    @admin.action(description="Mark selected bookings as completed")
    def mark_completed(self, request, queryset):
        updated = queryset.update(status=Booking.BookingStatus.COMPLETED)
        self.message_user(request, f"{updated} booking(s) marked completed.")

    @admin.action(description="Cancel selected bookings")
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status=Booking.BookingStatus.CANCELLED)
        self.message_user(request, f"{updated} booking(s) cancelled.")

    @admin.display(description="Invoice")
    def invoice_status(self, obj):
        invoice = getattr(obj, "invoice", None)
        return invoice.status if invoice else "No invoice"

# Register your models here.
