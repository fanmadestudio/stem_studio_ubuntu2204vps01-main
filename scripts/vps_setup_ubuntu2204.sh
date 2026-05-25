#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

APP_USER="${APP_USER:-$USER}"
APP_GROUP="${APP_GROUP:-$USER}"
POSTGRES_DB="${POSTGRES_DB:-stem_studio}"
POSTGRES_USER="${POSTGRES_USER:-stem_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-change-me-strong-password}"
POSTGRES_PASSWORD_SQL="${POSTGRES_PASSWORD//\'/\'\'}"
PUBLIC_HOST="${PUBLIC_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required on Ubuntu VPS"
  exit 1
fi

sudo apt update
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib nginx curl ca-certificates gnupg

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v(20|21|22)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if [ ! -d "$BACKEND_DIR/.venv" ]; then
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD_SQL}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"

cat > "$BACKEND_DIR/.env" <<EOF
DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=${PUBLIC_HOST},localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://${PUBLIC_HOST}:${FRONTEND_PORT}
DJANGO_CSRF_TRUSTED_ORIGINS=http://${PUBLIC_HOST}:${FRONTEND_PORT}
DB_ENGINE=django.db.backends.postgresql
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SSLMODE=disable
DB_CONN_MAX_AGE=120
DB_CONNECT_TIMEOUT=10
EOF

cd "$BACKEND_DIR"
./.venv/bin/python manage.py migrate

cd "$FRONTEND_DIR"
npm ci
npm run build

sudo cp "$ROOT_DIR/deploy/systemd/stem-backend.service" /etc/systemd/system/stem-backend.service
sudo cp "$ROOT_DIR/deploy/systemd/stem-frontend.service" /etc/systemd/system/stem-frontend.service

sudo sed -i "s|__APP_USER__|$APP_USER|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service
sudo sed -i "s|__APP_GROUP__|$APP_GROUP|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service
sudo sed -i "s|__PROJECT_ROOT__|$ROOT_DIR|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service

sudo systemctl daemon-reload
sudo systemctl enable stem-backend stem-frontend
sudo systemctl restart stem-backend stem-frontend

echo "Setup complete."
echo "Backend: http://${PUBLIC_HOST}:8000"
echo "Frontend: http://${PUBLIC_HOST}:${FRONTEND_PORT}"
echo "Create admin user:"
echo "cd \"$BACKEND_DIR\" && ./.venv/bin/python manage.py createsuperuser"
