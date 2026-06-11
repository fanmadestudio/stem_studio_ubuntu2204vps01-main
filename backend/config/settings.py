import os
from pathlib import Path
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
            "replace-with",
            "your-password",
            "change-me",
        )
    )


def _validate_database_env() -> None:
    db_engine = os.getenv("DB_ENGINE", "config.db.backends.sqlcipher").strip()
    db_name = os.getenv("DB_NAME", "").strip()
    db_password = os.getenv("DB_PASSWORD", "").strip()

    if not ENV_PATH.exists() and not db_name:
        raise ImproperlyConfigured(
            "Missing backend/.env. Copy backend/.env.example to backend/.env and fill in your SQLCipher settings."
        )

    if _looks_like_placeholder(db_password):
        raise ImproperlyConfigured(
            "Database settings still contain example placeholder values. Update backend/.env with your real SQLCipher key."
        )

    if db_engine != "config.db.backends.sqlcipher":
        raise ImproperlyConfigured("Only the SQLCipher backend is supported.")


_load_env_file()
_validate_database_env()

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

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
    "rest_framework.authtoken",
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

db_engine = os.getenv("DB_ENGINE", "config.db.backends.sqlcipher")
if db_engine != "config.db.backends.sqlcipher":
    raise ImproperlyConfigured(
        "Only the SQLCipher backend is supported."
    )

db_name = os.getenv("DB_NAME", str(BASE_DIR / "stem_studio.sqlite3"))
if db_name != ":memory:":
    db_name = str(Path(db_name).expanduser())

database_settings = {
    "ENGINE": db_engine,
    "NAME": db_name,
    "OPTIONS": {
        "key": os.getenv("DB_PASSWORD", ""),
        "timeout": int(os.getenv("DB_TIMEOUT", "10")),
        "cipher_page_size": os.getenv("DB_CIPHER_PAGE_SIZE", ""),
        "kdf_iter": os.getenv("DB_KDF_ITER", ""),
    },
}

DATABASES = {"default": database_settings}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

default_authentication_classes = [
    "users.auth.DjangoBearerTokenAuthentication",
    "rest_framework.authentication.SessionAuthentication",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": tuple(default_authentication_classes),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Keep browser sessions short for shared-workstation use.
SESSION_COOKIE_AGE = 30 * 60
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CORS_ALLOWED_ORIGINS = _env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_ALL_ORIGINS = os.getenv("DJANGO_CORS_ALLOW_ALL_ORIGINS", "0") == "1"
if DEBUG and not CORS_ALLOWED_ORIGINS and not CORS_ALLOW_ALL_ORIGINS:
    # Local preview environments can use dynamic frontend origins during development.
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
