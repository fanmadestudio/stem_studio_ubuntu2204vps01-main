from django.db import migrations, models


def clear_duplicated_usernames(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(username=models.F("email")).update(username="")


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_seed_default_accounts"),
    ]

    operations = [
        migrations.RunPython(clear_duplicated_usernames, migrations.RunPython.noop),
    ]
