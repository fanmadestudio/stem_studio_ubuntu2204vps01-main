from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="invoice",
            name="status",
            field=models.CharField(
                choices=[
                    ("unpaid", "Unpaid"),
                    ("partial", "Partially Paid"),
                    ("paid", "Paid"),
                    ("cancelled", "Cancelled"),
                ],
                default="unpaid",
                max_length=20,
            ),
        ),
    ]
