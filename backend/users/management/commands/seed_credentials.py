from django.core.management.base import BaseCommand

from users.models import User, UserRole


class Command(BaseCommand):
    help = "Seed default admin and staff credentials only."

    def handle(self, *args, **options):
        accounts = [
            {
                "email": "admin@stemstudio.com",
                "password": "4dm1nst3mstvd10",
                "role": UserRole.ADMIN,
                "first_name": "Admin",
                "last_name": "Stemstudio",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "staff@stemstudio.com",
                "password": "St4ffst3mstvd10",
                "role": UserRole.STAFF,
                "first_name": "Staff",
                "last_name": "Stemstudio",
                "is_staff": True,
                "is_superuser": False,
            },
        ]

        for account in accounts:
            password = account.pop("password")
            email = account["email"]
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={**account, "username": "", "is_active": True},
            )
            user.set_password(password)
            user.save(update_fields=["password"])

        self.stdout.write(self.style.SUCCESS("Default credentials seeded successfully."))
