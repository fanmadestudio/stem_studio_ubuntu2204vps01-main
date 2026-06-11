from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_clear_duplicated_usernames"),
    ]

    replaces = [
        ("users", "0004_user_supabase_user_id"),
        ("users", "0005_remove_user_supabase_user_id"),
    ]

    operations = []
