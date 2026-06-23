from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "first_name", "last_name", "role", "is_active", "is_staff", "is_superuser", "last_login"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser", "groups", "date_joined"]
    readonly_fields = ["last_login", "date_joined"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )
    search_fields = ["email", "first_name", "last_name"]
    actions = ["activate_users", "deactivate_users", "mark_staff"]

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} user(s) activated.")

    @admin.action(description="Deactivate selected users")
    def deactivate_users(self, request, queryset):
        updated = queryset.exclude(is_superuser=True).update(is_active=False)
        self.message_user(request, f"{updated} non-superuser account(s) deactivated.")

    @admin.action(description="Grant staff access to selected users")
    def mark_staff(self, request, queryset):
        updated = queryset.update(is_staff=True)
        self.message_user(request, f"{updated} user(s) granted staff access.")

# Register your models here.
