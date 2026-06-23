#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

APP_USER="${APP_USER:-$USER}"
APP_GROUP="${APP_GROUP:-$USER}"
SQLCIPHER_KEY="${SQLCIPHER_KEY:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')}"
PUBLIC_HOST="${PUBLIC_HOST:-}"
PUBLIC_SCHEME="${PUBLIC_SCHEME:-https}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

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
sudo apt install -y python3 python3-venv python3-pip sqlcipher libsqlcipher-dev nginx curl ca-certificates certbot python3-certbot-nginx

if [ ! -d "$BACKEND_DIR/.venv" ]; then
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

cat > "$BACKEND_DIR/.env" <<EOF
DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=${PUBLIC_HOST},localhost,127.0.0.1
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
./.venv/bin/python manage.py collectstatic --noinput

sudo cp "$ROOT_DIR/deploy/systemd/stem-backend.service" /etc/systemd/system/stem-backend.service
sudo sed -i "s|__APP_USER__|$APP_USER|g" /etc/systemd/system/stem-backend.service
sudo sed -i "s|__APP_GROUP__|$APP_GROUP|g" /etc/systemd/system/stem-backend.service
sudo sed -i "s|__PROJECT_ROOT__|$ROOT_DIR|g" /etc/systemd/system/stem-backend.service
sudo sed -i "s|__BACKEND_PORT__|$BACKEND_PORT|g" /etc/systemd/system/stem-backend.service

sudo systemctl daemon-reload
sudo systemctl enable stem-backend
sudo systemctl restart stem-backend

sudo tee /etc/nginx/sites-available/stem-studio >/dev/null <<EOF
server {
    listen 80;
    server_name ${PUBLIC_HOST};

    client_max_body_size 25m;

    location /static/ {
        alias ${BACKEND_DIR}/staticfiles/;
    }

    location /media/ {
        alias ${BACKEND_DIR}/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/stem-studio /etc/nginx/sites-enabled/stem-studio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Setup complete."
echo "Django Admin: ${PUBLIC_SCHEME}://${PUBLIC_HOST}/admin/"
if [ "$PUBLIC_SCHEME" = "https" ]; then
  echo "Issue the TLS certificate after DNS points to this VPS:"
  echo "sudo certbot --nginx -d ${PUBLIC_HOST}"
fi
echo "Create admin user:"
echo "cd \"$BACKEND_DIR\" && ./.venv/bin/python manage.py createsuperuser"
