#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

APP_USER="${APP_USER:-$USER}"
APP_GROUP="${APP_GROUP:-$USER}"
SQLCIPHER_KEY="${SQLCIPHER_KEY:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')}"
PUBLIC_HOST="${PUBLIC_HOST:-}"
PUBLIC_SCHEME="${PUBLIC_SCHEME:-https}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"
VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://127.0.0.1:${BACKEND_PORT}}"

if [ -z "$PUBLIC_HOST" ]; then
  echo "Set PUBLIC_HOST to your domain before running this script, for example:"
  echo "PUBLIC_HOST=stemstudio.example.com bash scripts/vps_setup_ubuntu2204.sh"
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required on Ubuntu VPS"
  exit 1
fi

sudo apt update
sudo apt install -y python3 python3-venv python3-pip sqlcipher libsqlcipher-dev nginx curl ca-certificates gnupg certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v(20|21|22)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if [ ! -d "$BACKEND_DIR/.venv" ]; then
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"
pip install --upgrade pip
if [ -f "$BACKEND_DIR/requirements-sqlcipher.txt" ]; then
  pip install -r "$BACKEND_DIR/requirements-sqlcipher.txt"
else
  pip install -r "$BACKEND_DIR/requirements.txt"
fi

cat > "$BACKEND_DIR/.env" <<EOF
DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=${PUBLIC_HOST},localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=${PUBLIC_SCHEME}://${PUBLIC_HOST}
DJANGO_CSRF_TRUSTED_ORIGINS=${PUBLIC_SCHEME}://${PUBLIC_HOST}
DJANGO_SECURE_PROXY_SSL_HEADER=1
DJANGO_SECURE_SSL_REDIRECT=$([ "$PUBLIC_SCHEME" = "https" ] && echo "1" || echo "0")
DJANGO_SESSION_COOKIE_SECURE=$([ "$PUBLIC_SCHEME" = "https" ] && echo "1" || echo "0")
DJANGO_CSRF_COOKIE_SECURE=$([ "$PUBLIC_SCHEME" = "https" ] && echo "1" || echo "0")
DB_ENGINE=config.db.backends.sqlcipher
DB_NAME=db.sqlite3
SQLCIPHER_KEY=${SQLCIPHER_KEY}
DB_CONN_MAX_AGE=120
EOF

cd "$BACKEND_DIR"
./.venv/bin/python manage.py migrate

cd "$FRONTEND_DIR"
cat > "$FRONTEND_DIR/.env.production" <<EOF
VITE_API_BASE_URL=${VITE_API_BASE_URL}
VITE_API_PROXY_TARGET=${VITE_API_PROXY_TARGET}
EOF
npm ci
npm run build

sudo cp "$ROOT_DIR/deploy/systemd/stem-backend.service" /etc/systemd/system/stem-backend.service
sudo cp "$ROOT_DIR/deploy/systemd/stem-frontend.service" /etc/systemd/system/stem-frontend.service

sudo sed -i "s|__APP_USER__|$APP_USER|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service
sudo sed -i "s|__APP_GROUP__|$APP_GROUP|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service
sudo sed -i "s|__PROJECT_ROOT__|$ROOT_DIR|g" /etc/systemd/system/stem-backend.service /etc/systemd/system/stem-frontend.service
sudo sed -i "s|__BACKEND_PORT__|$BACKEND_PORT|g" /etc/systemd/system/stem-backend.service

sudo systemctl daemon-reload
sudo systemctl enable stem-backend stem-frontend
sudo systemctl restart stem-backend stem-frontend

sudo tee /etc/nginx/sites-available/stem-studio >/dev/null <<EOF
server {
    listen 80;
    server_name ${PUBLIC_HOST};

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/stem-studio /etc/nginx/sites-enabled/stem-studio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Setup complete."
echo "Public URL: ${PUBLIC_SCHEME}://${PUBLIC_HOST}"
if [ "$PUBLIC_SCHEME" = "https" ]; then
  echo "Issue the TLS certificate after DNS points to this VPS:"
  echo "sudo certbot --nginx -d ${PUBLIC_HOST}"
fi
echo "Create admin user:"
echo "cd \"$BACKEND_DIR\" && ./.venv/bin/python manage.py createsuperuser"
