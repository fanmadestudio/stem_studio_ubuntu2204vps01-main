from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "notification_type", "status", "scheduled_for", "created_at"]
    list_filter = ["notification_type", "status", "scheduled_for", "created_at"]
    search_fields = ["title", "message", "user__email", "user__first_name", "user__last_name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"
    actions = ["mark_sent", "mark_failed", "mark_pending"]
    fieldsets = (
        (None, {"fields": ("user", "title", "message")}),
        ("Delivery", {"fields": ("notification_type", "status", "scheduled_for")}),
        ("Audit", {"fields": ("created_at",)}),
    )

    @admin.action(description="Mark selected notifications as sent")
    def mark_sent(self, request, queryset):
        updated = queryset.update(status=Notification.NotificationStatus.SENT)
        self.message_user(request, f"{updated} notification(s) marked sent.")

    @admin.action(description="Mark selected notifications as failed")
    def mark_failed(self, request, queryset):
        updated = queryset.update(status=Notification.NotificationStatus.FAILED)
        self.message_user(request, f"{updated} notification(s) marked failed.")

    @admin.action(description="Mark selected notifications as pending")
    def mark_pending(self, request, queryset):
        updated = queryset.update(status=Notification.NotificationStatus.PENDING)
        self.message_user(request, f"{updated} notification(s) marked pending.")

# Register your models here.
