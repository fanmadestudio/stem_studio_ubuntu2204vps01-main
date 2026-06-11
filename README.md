# STEM Studio

STEM Studio is a monorepo for a recording studio management system. It combines a Django REST API, a Next.js dashboard, Django token authentication, and local PostgreSQL storage for handling clients, bookings, studio resources, billing, and operational reporting.

## What This Project Does

- Authenticates users with Django-native login and maps them to app roles in Django.
- Manages clients, studio rooms, engineers, and equipment.
- Schedules bookings with backend-side conflict validation.
- Tracks invoices and payments.
- Shows operational dashboard metrics and recent activity.
- Supports local development and Ubuntu VPS deployment.

## Tech Stack

- Backend: Django 4.2, Django REST Framework
- Frontend: Next.js 15 App Router, React 19, TypeScript
- Database: PostgreSQL
- Authentication: Django token auth
- Deployment helpers: systemd service files, Ubuntu setup script

## Repository Structure

```text
stem_studio_-main/
|-- backend/                 Django project and domain apps
|   |-- analytics/           Dashboard aggregation endpoint
|   |-- billing/             Invoices and payments
|   |-- bookings/            Booking management
|   |-- clients/             Client profiles
|   |-- config/              Django settings and URL wiring
|   |-- notifications/       Notification records
|   |-- resources/           Rooms, engineers, equipment
|   `-- users/               Custom user model and auth endpoints
|-- frontend/                Next.js application
|   `-- app/                 App Router pages, components, and libs
|-- deploy/systemd/          Backend/frontend service unit templates
|-- scripts/                 Local helper scripts and VPS bootstrap
|-- TECHNICAL_DOCUMENTATION.md
|-- PROJECT_MAPPING.md
`-- prd_studio_recording_management_system.md
```

## Application Modules

### Backend apps

- `users`: custom email-based user model, role management, Django token auth, profile endpoint, seed commands
- `clients`: client CRUD tied to Django users
- `resources`: room, engineer, and equipment CRUD
- `bookings`: booking lifecycle and schedule conflict checks
- `billing`: invoice and payment APIs plus invoice status recalculation
- `notifications`: notification records for reminders/system messages
- `analytics`: dashboard summary endpoint

### Frontend routes

- `/login`: Django sign-in screen
- `/`: dashboard with KPIs, trends, activity feed, and API health
- `/clients`: create and view clients
- `/booking`: create bookings, manage room list, update booking status
- `/staff-equipment`: manage engineers/staff and equipment
- `/invoices`: invoice list
- `/invoices/[id]`: invoice detail, payment history, print-to-PDF view
- `/settings`: profile and password management

## Architecture Overview

```text
Next.js frontend
    |
    | Bearer token from Django session
    v
Django REST API (/api/v1/)
    |
    | validates bearer token and maps user role
    v
PostgreSQL
```

### Auth flow

1. User signs in through Django-native login on the frontend.
2. Frontend stores the access token in local storage.
3. API requests send `Authorization: Bearer <token>`.
4. Django validates the local token.
5. The matching Django user profile provides role-aware app access.

## Quick Start

### Prerequisites

- Python 3.11+ recommended
- Node.js 20+ recommended
- npm
- PostgreSQL 14+ recommended
- PostgreSQL must be available locally or on the target server

### 1. Backend setup

```powershell
cd backend
Copy-Item .env.example .env
py -3 -m pip install -r requirements.txt
py -3 manage.py migrate
py -3 manage.py seed_credentials
py -3 manage.py runserver 0.0.0.0:8000
```

### 2. Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:3000` and expects the backend on `http://127.0.0.1:8000` unless overridden.

## Environment Configuration

### Backend `.env`

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`.

Required values:

```env
DJANGO_SECRET_KEY=replace-with-strong-secret
```

Use either a single PostgreSQL connection string:

```env
DATABASE_URL=postgresql://stemstudio:your-password@127.0.0.1:5432/stem_studio?sslmode=prefer
```

Or split PostgreSQL values:

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=stem_studio
DB_USER=stemstudio
DB_PASSWORD=your-strong-db-password
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SSLMODE=prefer
DB_CONNECT_TIMEOUT=10
```

### Frontend `.env.local`

Optional, but recommended:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

If `NEXT_PUBLIC_API_BASE_URL` is missing, the frontend falls back to `http://<current-host>:8000`.

## Seeded Accounts

Run:

Fresh database migrations seed these default Django users automatically, and you can re-run the command below any time to reset them:

```powershell
cd backend
py -3 manage.py seed_credentials
```

Default Django users:

- `admin@stemstudio.com / 4dm1nst3mstvd10`
- `staff@stemstudio.com / St4ffst3mstvd10`

These accounts can sign in directly through the Django login form.

## API Summary

Base path: `/api/v1/`

### Auth

- `POST /auth/login/`
- `GET /auth/profile/`
- `PATCH /auth/profile/`
- `GET|POST /users/`
- `GET|PATCH|DELETE /users/{id}/`

### Clients

- `GET|POST /clients/`
- `GET|PATCH|DELETE /clients/{id}/`

### Resources

- `GET|POST /rooms/`
- `GET|PATCH|DELETE /rooms/{id}/`
- `GET|POST /engineers/`
- `GET|PATCH|DELETE /engineers/{id}/`
- `GET|POST /equipment/`
- `GET|PATCH|DELETE /equipment/{id}/`

### Bookings

- `GET|POST /bookings/`
- `GET|PATCH|DELETE /bookings/{id}/`

### Billing

- `GET|POST /invoices/`
- `GET|PATCH|DELETE /invoices/{id}/`
- `GET|POST /payments/`
- `GET|PATCH|DELETE /payments/{id}/`

### Other

- `GET|POST /notifications/`
- `GET|PATCH|DELETE /notifications/{id}/`
- `GET /analytics/dashboard/`

More detail is in [`docs/api-reference.md`](docs/api-reference.md).

## Deployment

### Ubuntu 22.04 VPS

The repo includes [`scripts/vps_setup_ubuntu2204.sh`](scripts/vps_setup_ubuntu2204.sh) plus systemd templates in [`deploy/systemd`](deploy/systemd).

Example:

```bash
cd stem_studio_-main
chmod +x scripts/vps_setup_ubuntu2204.sh
PUBLIC_HOST=<VPS_IP> \
DB_NAME=stem_studio \
DB_USER=stemstudio \
DB_PASSWORD='<STRONG_DB_PASSWORD>' \
DB_HOST=127.0.0.1 \
DB_PORT=5432 \
DB_SSLMODE=prefer \
bash scripts/vps_setup_ubuntu2204.sh
```

The setup script installs PostgreSQL on the VPS, creates the database and login role, and configures Django to connect over `127.0.0.1` with password authentication that works with `psycopg` and Django.

## Known Gaps

- Automated backend/frontend test coverage is still minimal.
- Some auth state uses legacy local storage aliases for backward compatibility.
- Invoice detail currently loads related records through multiple API requests instead of a dedicated aggregate endpoint.
- The dashboard health check uses the analytics endpoint rather than a separate lightweight health endpoint.

## Additional Documents

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api-reference.md`](docs/api-reference.md)
- [`TECHNICAL_DOCUMENTATION.md`](TECHNICAL_DOCUMENTATION.md)
- [`PROJECT_MAPPING.md`](PROJECT_MAPPING.md)
- [`prd_studio_recording_management_system.md`](prd_studio_recording_management_system.md)
