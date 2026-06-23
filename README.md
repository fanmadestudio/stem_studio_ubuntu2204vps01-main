# STEM Studio

STEM Studio is a full-stack recording studio management application. It helps studio administrators and staff manage clients, rooms, engineers, equipment, bookings, invoices, payments, notifications, and dashboard analytics from one web dashboard.

The app is built as a monorepo with a Django REST API backend and a Vite React frontend.

## What This Repository Contains

- `backend/`: Django project, REST API apps, custom user model, migrations, SQLCipher/SQLite database configuration.
- `frontend/`: Vite + React 19 + TypeScript app with client-side routing.
- `deploy/systemd/`: systemd service templates for VPS deployment.
- `scripts/`: Windows helper scripts and Ubuntu 22.04 VPS setup script.
- `VPS_PLAYBOOK.md`: VPS-only update/config/rollback runbook.

## Main Features

- Django session login/logout with CSRF protection.
- Role-aware backend permissions for `admin`, `staff`, and `client`.
- Dashboard KPIs, revenue trends, booking activity, and system health.
- Client management.
- Booking management with room and engineer conflict validation.
- Room, engineer/staff, and equipment management.
- Invoice generation from bookings.
- Payment tracking with automatic invoice status recalculation.
- Monthly invoice/revenue reports.
- Notification records API.
- Ubuntu VPS deployment support with Gunicorn, systemd, Nginx, and optional HTTPS.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite, React 19, TypeScript |
| Backend | Django 4.2, Django REST Framework |
| Auth | Django built-in authentication, session cookies, CSRF |
| Database | SQLCipher-backed SQLite by default; plain SQLite supported |
| Production | Gunicorn, systemd, Nginx, Ubuntu 22.04 |

## API Base

All application API routes use:

```text
/api/v1/
```

Important auth routes:

```text
GET  /api/v1/auth/csrf/
POST /api/v1/auth/login/
POST /api/v1/auth/logout/
GET  /api/v1/auth/me/
GET  /api/v1/auth/profile/
PATCH /api/v1/auth/profile/
POST /api/v1/auth/register/
```

## Run Locally

### Backend

```powershell
cd backend
Copy-Item .env.example .env
py -3 -m pip install -r requirements.txt
py -3 manage.py migrate
py -3 manage.py seed_credentials
py -3 manage.py runserver 0.0.0.0:8000
```

For local plain SQLite, set this in `backend/.env`:

```env
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Optional `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

When `VITE_API_BASE_URL` is empty, the frontend uses same-origin `/api/...` paths. In local dev, Vite can proxy `/api` to the backend.

## Default Accounts

Seed or update default accounts with:

```powershell
cd backend
py -3 manage.py seed_credentials
```

Change default credentials before real production use.

## VPS Deployment

For VPS setup, update, restart, logs, and rollback steps, use:

```text
VPS_PLAYBOOK.md
```

The initial Ubuntu 22.04 setup script is:

```bash
scripts/vps_setup_ubuntu2204.sh
```
