from pathlib import Path
from itertools import tee
from collections.abc import Mapping

from django.core.exceptions import ImproperlyConfigured
from django.db.backends.sqlite3.base import (
    DatabaseWrapper as SQLiteDatabaseWrapper,
    FORMAT_QMARK_REGEX,
)

try:
    from sqlcipher3 import dbapi2 as sqlcipher_database
except ImportError as exc:
    raise ImproperlyConfigured(
        "sqlcipher3 is not installed. Install backend requirements before starting Django."
    ) from exc


class DatabaseWrapper(SQLiteDatabaseWrapper):
    Database = sqlcipher_database

    def get_connection_params(self):
        conn_params = super().get_connection_params()
        conn_params.pop("key", None)
        conn_params.pop("cipher_page_size", None)
        conn_params.pop("kdf_iter", None)
        return conn_params

    def get_new_connection(self, conn_params):
        db_name = conn_params.get("database")
        if db_name and db_name != ":memory:":
            Path(db_name).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
        conn = self.Database.connect(**conn_params)
        self._apply_sqlcipher_pragmas(conn)
        return conn

    def create_cursor(self, name=None):
        return self.connection.cursor(factory=SQLCipherCursorWrapper)

    def _apply_sqlcipher_pragmas(self, conn):
        options = self.settings_dict.get("OPTIONS", {})
        key = options.get("key", "")
        if not key:
            raise ImproperlyConfigured("DB_PASSWORD must be set for the SQLCipher database.")

        with conn:
            cursor = conn.cursor()
            escaped_key = str(key).replace("'", "''")
            cursor.execute(f"PRAGMA key = '{escaped_key}';")

            cipher_page_size = options.get("cipher_page_size")
            if cipher_page_size:
                cursor.execute(f"PRAGMA cipher_page_size = {int(cipher_page_size)};")

            kdf_iter = options.get("kdf_iter")
            if kdf_iter:
                cursor.execute(f"PRAGMA kdf_iter = {int(kdf_iter)};")

            cursor.execute("SELECT count(*) FROM sqlite_master;")


class SQLCipherCursorWrapper(sqlcipher_database.Cursor):
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
