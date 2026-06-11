from django.db import migrations


def seed_dummy_data(apps, schema_editor):
    return


def unseed_dummy_data(apps, schema_editor):
    return


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_clear_duplicated_usernames"),
        ("clients", "0002_initial"),
        ("resources", "0003_engineer_role"),
        ("bookings", "0004_booking_notes"),
        ("billing", "0003_invoice_cancelled_status"),
        ("notifications", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_dummy_data, unseed_dummy_data),
    ]
