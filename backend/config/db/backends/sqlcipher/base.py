from collections.abc import Mapping
from itertools import tee

try:
    from sqlcipher3 import dbapi2 as Database
except ImportError as exc:  # pragma: no cover - import-time configuration guard
    raise ImportError(
        "SQLCipher support requires sqlcipher3. Install backend requirements before running Django."
    ) from exc

from django.db.backends.sqlite3.base import DatabaseWrapper as SQLiteDatabaseWrapper
from django.db.backends.sqlite3.base import FORMAT_QMARK_REGEX
from django.db.backends.sqlite3.base import register_functions
from django.utils.asyncio import async_unsafe


class SQLCipherCursorWrapper(Database.Cursor):
    """Translate Django's parameter styles to SQLCipher's SQLite parameter style."""

    def execute(self, query, params=None):
        if params is None:
            return super().execute(query)
        param_names = list(params) if isinstance(params, Mapping) else None
        query = self.convert_query(query, param_names=param_names)
        return super().execute(query, params)

    def executemany(self, query, param_list):
        peekable, param_list = tee(iter(param_list))
        if (params := next(peekable, None)) and isinstance(params, Mapping):
            param_names = list(params)
        else:
            param_names = None
        query = self.convert_query(query, param_names=param_names)
        return super().executemany(query, param_list)

    def convert_query(self, query, *, param_names=None):
        if param_names is None:
            return FORMAT_QMARK_REGEX.sub("?", query).replace("%%", "%")
        return query % {name: f":{name}" for name in param_names}


class DatabaseWrapper(SQLiteDatabaseWrapper):
    """SQLite-compatible Django backend that opens databases through SQLCipher."""

    def create_cursor(self, name=None):
        return self.connection.cursor(factory=SQLCipherCursorWrapper)

    @async_unsafe
    def get_new_connection(self, conn_params):
        conn = Database.connect(**conn_params)
        key = self.settings_dict.get("SQLCIPHER_KEY")
        if key:
            escaped_key = str(key).replace("'", "''")
            conn.execute(f"PRAGMA key = '{escaped_key}'")
            # Force SQLCipher to validate the key before migrations or queries run.
            conn.execute("SELECT count(*) FROM sqlite_master")

        register_functions(conn)
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA legacy_alter_table = OFF")
        return conn
