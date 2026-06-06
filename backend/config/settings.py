import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


def _load_env_file() -> None:
    if not ENV_PATH.exists():
        return
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


def _env_list(key: str, default: str = "") -> list[str]:
    raw_value = os.getenv(key, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _looks_like_placeholder(value: str | None) -> bool:
    if not value:
        return False
    normalized = value.strip().lower()
    return any(
        marker in normalized
        for marker in (
            "your-project-ref",
            "replace-with",
            "your-password",
            "your-supabase-db-password",
        )
    )


def _validate_database_env() -> None:
    database_url = os.getenv("DATABASE_URL", "").strip()
    split_values = {
        "DB_HOST": os.getenv("DB_HOST", "").strip(),
        "DB_USER": os.getenv("DB_USER", "").strip(),
        "DB_PASSWORD": os.getenv("DB_PASSWORD", "").strip(),
    }

    if not ENV_PATH.exists() and not database_url and not any(split_values.values()):
        raise ImproperlyConfigured(
            "Missing backend/.env. Copy backend/.env.example to backend/.env and fill in your Supabase database credentials."
        )

    if _looks_like_placeholder(database_url) or any(_looks_like_placeholder(value) for value in split_values.values()):
        raise ImproperlyConfigured(
            "Supabase database settings still contain example placeholder values. Update backend/.env with your real project ref, database password, and host."
        )


def _validate_supabase_auth_env() -> None:
    missing = [key for key in ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY") if not os.getenv(key, "").strip()]
    if missing:
        raise ImproperlyConfigured(f"Missing Supabase Auth settings in backend/.env: {', '.join(missing)}")


def _database_config_from_url(database_url: str) -> dict[str, object]:
    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL must use a PostgreSQL scheme.")

    query = parse_qs(parsed.query)
    options = {
        "sslmode": query.get("sslmode", [os.getenv("DB_SSLMODE", "prefer")])[0],
        "connect_timeout": int(query.get("connect_timeout", [os.getenv("DB_CONNECT_TIMEOUT", "10")])[0]),
    }
    channel_binding = query.get("channel_binding", [os.getenv("DB_CHANNEL_BINDING", "")])[0]
    if channel_binding:
        options["channel_binding"] = channel_binding

    return {
        "ENGINE": "config.db.backends.postgresql",
        "NAME": parsed.path.lstrip("/") or os.getenv("DB_NAME", "postgres"),
        "USER": parsed.username or os.getenv("DB_USER", "postgres"),
        "PASSWORD": parsed.password or os.getenv("DB_PASSWORD", "postgres"),
        "HOST": parsed.hostname or os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": str(parsed.port or os.getenv("DB_PORT", "5432")),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
        "CONN_HEALTH_CHECKS": os.getenv("DB_CONN_HEALTH_CHECKS", "1") == "1",
        "OPTIONS": options,
    }


_load_env_file()
_validate_database_env()
_validate_supabase_auth_env()

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()

AUTH_USER_MODEL = "users.User"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "users",
    "clients",
    "resources",
    "bookings",
    "billing",
    "notifications",
    "analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

db_engine = os.getenv("DB_ENGINE", "django.db.backends.postgresql")
if db_engine == "django.db.backends.postgresql":
    db_engine = "config.db.backends.postgresql"
elif db_engine != "config.db.backends.postgresql":
    raise ImproperlyConfigured(
        "Only PostgreSQL-compatible backends are supported. Configure Supabase using PostgreSQL connection settings."
    )

database_url = os.getenv("DATABASE_URL")
if database_url:
    database_settings = _database_config_from_url(database_url)
else:
    db_name = os.getenv("DB_NAME", "studio_recording")
    db_options = {}
    if "postgresql" in db_engine:
        db_options = {
            "sslmode": os.getenv("DB_SSLMODE", "prefer"),
            "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "10")),
        }
        db_channel_binding = os.getenv("DB_CHANNEL_BINDING")
        if db_channel_binding:
            db_options["channel_binding"] = db_channel_binding

    database_settings = {
        "ENGINE": db_engine,
        "NAME": db_name,
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
        "CONN_HEALTH_CHECKS": os.getenv("DB_CONN_HEALTH_CHECKS", "1") == "1",
        "OPTIONS": db_options,
    }

DATABASES = {"default": database_settings}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "users.supabase_auth.SupabaseJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Keep Django sessions aligned with JWT lifetime.
SESSION_COOKIE_AGE = 30 * 60
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CORS_ALLOWED_ORIGINS = _env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_ALL_ORIGINS = os.getenv("DJANGO_CORS_ALLOW_ALL_ORIGINS", "0") == "1"
if DEBUG and not CORS_ALLOWED_ORIGINS and not CORS_ALLOW_ALL_ORIGINS:
    # In ephemeral dev platforms (e.g. CodeSandbox), frontend origins are dynamic.
    CORS_ALLOW_ALL_ORIGINS = True

CSRF_TRUSTED_ORIGINS = _env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
