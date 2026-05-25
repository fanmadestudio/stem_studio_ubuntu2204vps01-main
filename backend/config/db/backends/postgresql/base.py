import logging
import os
import time

from django.db.backends.postgresql.base import DatabaseWrapper as PostgresDatabaseWrapper
from psycopg import OperationalError


logger = logging.getLogger(__name__)


class DatabaseWrapper(PostgresDatabaseWrapper):
    """Retry the initial connection so cold-starting hosted Postgres can wake up."""

    def get_new_connection(self, conn_params):
        retries = max(0, int(os.getenv("DB_CONNECT_RETRIES", "6")))
        delay = max(0.0, float(os.getenv("DB_CONNECT_RETRY_DELAY", "5")))

        for attempt in range(retries + 1):
            try:
                return super().get_new_connection(conn_params)
            except OperationalError:
                if attempt >= retries:
                    raise
                logger.warning(
                    "Database connection attempt %s/%s failed. Retrying in %.1f seconds.",
                    attempt + 1,
                    retries + 1,
                    delay,
                )
                time.sleep(delay)
