from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_user_supabase_user_id"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="supabase_user_id",
        ),
    ]
