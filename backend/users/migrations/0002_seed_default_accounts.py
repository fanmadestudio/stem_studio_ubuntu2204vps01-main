from django.db import migrations


def seed_default_accounts(apps, schema_editor):
    # Default account seeding is intentionally disabled.
    return


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_accounts, migrations.RunPython.noop),
    ]
