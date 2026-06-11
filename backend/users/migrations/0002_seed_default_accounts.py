from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_default_accounts(apps, schema_editor):
    User = apps.get_model("users", "User")
    accounts = [
        {
            "email": "admin@stemstudio.com",
            "password": "4dm1nst3mstvd10",
            "role": "admin",
            "first_name": "Admin",
            "last_name": "Stemstudio",
            "is_staff": True,
            "is_superuser": True,
        },
        {
            "email": "staff@stemstudio.com",
            "password": "St4ffst3mstvd10",
            "role": "staff",
            "first_name": "Staff",
            "last_name": "Stemstudio",
            "is_staff": True,
            "is_superuser": False,
        },
    ]

    for account in accounts:
        password = account.pop("password")
        user, created = User.objects.get_or_create(
            email=account["email"],
            defaults={
                **account,
                "username": "",
                "is_active": True,
                "password": make_password(password),
            },
        )
        if created:
            continue

        for field, value in account.items():
            setattr(user, field, value)
        user.username = ""
        user.is_active = True
        user.password = make_password(password)
        user.save(
            update_fields=[
                "first_name",
                "last_name",
                "role",
                "is_staff",
                "is_superuser",
                "username",
                "is_active",
                "password",
            ]
        )


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_accounts, migrations.RunPython.noop),
    ]
