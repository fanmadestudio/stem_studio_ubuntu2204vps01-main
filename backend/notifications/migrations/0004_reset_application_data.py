from django.db import migrations


def reset_application_data(apps, schema_editor):
    # Keep historical migration number but make it safe:
    # do not wipe seeded data during normal migrate.
    return


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0003_seed_dummy_data"),
    ]

    operations = [
        migrations.RunPython(reset_application_data, migrations.RunPython.noop),
    ]
