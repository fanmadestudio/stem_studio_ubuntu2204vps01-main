# STEM Studio

STEM Studio is an internal recording studio operations system. The application is now Django Admin-only: staff use `/admin/` for login, dashboard navigation, CRUD, user management, permissions, bookings, invoices, payments, resources, clients, and notifications.

The former Vite React frontend and browser API layer were removed. There is no public-facing frontend and no separate login UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Internal UI | Django Admin |
| Backend | Django 4.2 |
| Auth | Django built-in users, staff access, groups, permissions |
| Database | SQLCipher-backed SQLite by default; plain SQLite supported |
| Production | Gunicorn, systemd, Nginx, Ubuntu 22.04 |

## Folder Structure

- `backend/`: Django project, apps, models, admin classes, migrations, settings.
- `deploy/systemd/`: Gunicorn systemd service template.
- `scripts/`: Windows local helper scripts and Ubuntu 22.04 VPS setup script.
- `VPS_PLAYBOOK.md`: deployment and operations notes.

Removed frontend/API components:

- `frontend/`, Vite config, TypeScript config, package files, and frontend build outputs.
- Frontend systemd service.
- DRF serializers, viewsets, routers, API auth endpoints, and CORS settings used only by React.

## Environment

Create `backend/.env` from `backend/.env.example`:

```env
DJANGO_SECRET_KEY=replace-with-strong-secret
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
DB_CONN_MAX_AGE=60
```

For production, set `DJANGO_DEBUG=0`, a strong `DJANGO_SECRET_KEY`, real `DJANGO_ALLOWED_HOSTS`, HTTPS `DJANGO_CSRF_TRUSTED_ORIGINS`, and secure cookie/proxy settings. SQLCipher can be enabled with `DB_ENGINE=config.db.backends.sqlcipher` and `SQLCIPHER_KEY`.

## Run Locally

```powershell
cd backend
Copy-Item .env.example .env
py -3 -m pip install -r requirements.txt
py -3 manage.py migrate
py -3 manage.py createsuperuser
py -3 manage.py collectstatic --noinput
py -3 manage.py runserver 0.0.0.0:8000
```

Open:

```text
http://127.0.0.1:8000/admin/
```

The repository helper script also opens the admin:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stemstudio.ps1
```

## Admin Operations

Django Admin is the primary interface. Use staff users for internal access, groups for roles, and model permissions for CRUD control.

Registered admin areas include:

- Users and permissions
- Clients
- Rooms, engineers, and equipment
- Bookings
- Invoices and inline payments
- Notifications

Admin classes include filters, search, date hierarchy, readonly audit fields, inlines, and safe actions such as marking bookings, equipment, engineers, invoices, and notifications.

## Deployment Notes

Production deployment should run Django through Gunicorn behind Nginx:

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
gunicorn -c gunicorn.conf.py config.wsgi:application
```

Nginx should proxy all application traffic to Gunicorn and serve `/static/` from `backend/staticfiles/` and `/media/` from `backend/media/` if uploads are used.

Use `scripts/vps_setup_ubuntu2204.sh` as the Ubuntu 22.04 baseline. Keep `DEBUG=False`, secrets in environment variables, HTTPS enabled, and database credentials outside source control.
