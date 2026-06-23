# STEM Studio VPS Playbook

STEM Studio deploys as a Django Admin-only application. There is no frontend service.

## Services

| Service | Purpose |
|---|---|
| `stem-backend` | Gunicorn running Django |
| `nginx` | Reverse proxy and static/media serving |

## Update

```bash
cd /home/<user>/stem_studio
git pull --ff-only
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart stem-backend
sudo nginx -t
sudo systemctl reload nginx
```

## Logs

```bash
sudo systemctl status stem-backend --no-pager
sudo journalctl -u stem-backend -n 100 --no-pager
sudo journalctl -u stem-backend -f
```

## Environment

Set these in `backend/.env`:

```env
DJANGO_SECRET_KEY=<strong-secret>
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=<domain>,localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=https://<domain>
DJANGO_SECURE_PROXY_SSL_HEADER=1
DJANGO_SECURE_SSL_REDIRECT=1
DJANGO_SESSION_COOKIE_SECURE=1
DJANGO_CSRF_COOKIE_SECURE=1
DB_ENGINE=config.db.backends.sqlcipher
DB_NAME=db.sqlite3
SQLCIPHER_KEY=<strong-sqlcipher-key>
```

## Admin

Create a superuser when needed:

```bash
cd /home/<user>/stem_studio/backend
source .venv/bin/activate
python manage.py createsuperuser
```

Access Django Admin at:

```text
https://<domain>/admin/
```
