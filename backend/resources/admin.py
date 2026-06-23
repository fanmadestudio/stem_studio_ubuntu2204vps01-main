from django.contrib import admin

from resources.models import Engineer, Equipment, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "booking_count"]
    search_fields = ["name"]
    ordering = ["name"]

    @admin.display(description="Bookings")
    def booking_count(self, obj):
        return obj.bookings.count()


@admin.register(Engineer)
class EngineerAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "user", "is_available", "booking_count"]
    list_filter = ["role", "is_available"]
    search_fields = ["name", "user__email", "user__first_name", "user__last_name"]
    ordering = ["name"]
    actions = ["mark_available", "mark_unavailable"]

    @admin.action(description="Mark selected engineers as available")
    def mark_available(self, request, queryset):
        updated = queryset.update(is_available=True)
        self.message_user(request, f"{updated} engineer(s) marked available.")

    @admin.action(description="Mark selected engineers as unavailable")
    def mark_unavailable(self, request, queryset):
        updated = queryset.update(is_available=False)
        self.message_user(request, f"{updated} engineer(s) marked unavailable.")

    @admin.display(description="Bookings")
    def booking_count(self, obj):
        return obj.bookings.count()


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "booking_count"]
    list_filter = ["status"]
    search_fields = ["name"]
    ordering = ["name"]
    actions = ["mark_ready", "mark_maintenance", "mark_busy"]

    @admin.action(description="Mark selected equipment as ready")
    def mark_ready(self, request, queryset):
        updated = queryset.update(status=Equipment.EquipmentStatus.READY)
        self.message_user(request, f"{updated} equipment item(s) marked ready.")

    @admin.action(description="Mark selected equipment for maintenance")
    def mark_maintenance(self, request, queryset):
        updated = queryset.update(status=Equipment.EquipmentStatus.MAINTENANCE)
        self.message_user(request, f"{updated} equipment item(s) marked for maintenance.")

    @admin.action(description="Mark selected equipment as busy")
    def mark_busy(self, request, queryset):
        updated = queryset.update(status=Equipment.EquipmentStatus.BUSY)
        self.message_user(request, f"{updated} equipment item(s) marked busy.")

    @admin.display(description="Bookings")
    def booking_count(self, obj):
        return obj.bookings.count()

# Register your models here.
