from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0003_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="notes",
            field=models.TextField(blank=True, default="", max_length=1000),
        ),
    ]
