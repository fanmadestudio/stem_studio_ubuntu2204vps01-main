import time

from django.core.management.base import BaseCommand, CommandError
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "Wait until the configured database accepts connections and responds to SELECT 1."

    def add_arguments(self, parser):
        parser.add_argument(
            "--timeout",
            type=int,
            default=180,
            help="Maximum number of seconds to wait before failing.",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=5,
            help="Seconds to wait between readiness checks.",
        )

    def handle(self, *args, **options):
        timeout = max(1, options["timeout"])
        interval = max(1, options["interval"])
        deadline = time.monotonic() + timeout
        connection = connections["default"]
        attempt = 0

        while True:
            attempt += 1
            try:
                connection.close()
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                self.stdout.write(self.style.SUCCESS(f"Database is ready after {attempt} attempt(s)."))
                return
            except OperationalError as exc:
                if time.monotonic() >= deadline:
                    raise CommandError(
                        f"Database did not become ready within {timeout} seconds. Last error: {exc}"
                    ) from exc
                self.stdout.write(
                    f"Database not ready yet (attempt {attempt}). Waiting {interval} seconds before retrying..."
                )
                time.sleep(interval)
