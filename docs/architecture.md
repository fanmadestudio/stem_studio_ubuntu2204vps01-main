# Architecture Guide

## Purpose

This document explains how STEM Studio is organized so a developer can understand where business logic lives, how data flows through the system, and where to extend the application safely.

## High-Level Design

```text
Browser
  -> Next.js frontend
  -> Django login
  -> Bearer token in API requests
  -> Django REST API
  -> Local PostgreSQL
```

The frontend is a client-rendered operations dashboard. The backend is the system of record for domain data and business rules. Django owns authentication, role mapping, and API behavior, while PostgreSQL stores application data locally on the target machine or VPS.

## Backend Design

### Core configuration

- Django project root: `backend/config/`
- Global URL prefix: `/api/v1/`
- Default authentication: `users.auth.DjangoBearerTokenAuthentication`
- Default permission: authenticated users only
- Database backend: PostgreSQL only

### Domain apps

#### `users`

Responsibilities:

- custom `User` model using email as the login identifier
- `role` values: `admin`, `staff`, `client`
- profile read/update endpoint
- seed and startup helper management commands

Key files:

- `backend/users/models.py`
- `backend/users/views.py`

#### `clients`

Responsibilities:

- one-to-one client profile linked to a Django user
- contact details and notes

Key relation:

- `Client -> User` is one-to-one

#### `resources`

Responsibilities:

- room catalog with pricing
- engineers/staff and availability
- equipment inventory and status

Key relations:

- `Engineer -> User` is optional one-to-one
- bookings reference rooms and engineers

#### `bookings`

Responsibilities:

- booking CRUD
- booking status workflow
- booking notes
- scheduling and conflict enforcement

Key relations:

- `Booking -> Client`
- `Booking -> Room`
- `Booking -> Engineer`
- `Booking <-> Equipment` many-to-many

#### `billing`

Responsibilities:

- invoice records for bookings
- payment records
- invoice status recalculation

Key relations:

- `Invoice -> Booking` is one-to-one
- `Payment -> Invoice` is many-to-one

#### `notifications`

Responsibilities:

- store reminder/system notification records
- status tracking for send workflow

#### `analytics`

Responsibilities:

- build dashboard payloads for the homepage
- aggregate bookings and invoice trends

Business logic is intentionally extracted into `backend/analytics/services.py`.

## Frontend Design

### App structure

- `frontend/app/layout.tsx`: root layout
- `frontend/app/components/`: shared UI pieces
- `frontend/app/lib/`: API, auth, formatting, and status helpers
- `frontend/app/<route>/page.tsx`: route-level screens

### Shared frontend utilities

- `lib/api.ts`
  - resolves backend base URL
  - injects bearer token
  - handles JSON and paginated list responses
- `lib/auth.ts`
  - signs in/out against Django
  - syncs session state into local storage
- `lib/format.ts`
  - shared IDR currency formatting
- `lib/status.ts`
  - maps domain statuses to CSS classes

### Important route behaviors

- Dashboard loads multiple list endpoints in parallel to compute KPIs client-side.
- Login authenticates against Django and then loads the Django profile.
- Booking page creates bookings and allows room CRUD from the same workflow.
- Invoice detail page composes data from invoice, booking, client, room, engineer, and payment endpoints.

## Data Model Summary

```text
User
  |- 1:1 Client
  `- 1:1 Engineer (optional)

Client
  `- 1:N Booking

Room
  `- 1:N Booking

Engineer
  `- 1:N Booking

Equipment
  `- N:N Booking

Booking
  `- 1:1 Invoice

Invoice
  `- 1:N Payment

User
  `- 1:N Notification
```

## Runtime Flow

### Login

1. User submits email/password on `/login`.
2. Frontend calls `POST /api/v1/auth/login/`.
3. Session token is stored in local storage.
4. Frontend calls `/api/v1/auth/profile/`.
5. Backend validates the token and returns the Django user profile.

### Booking creation

1. Frontend collects client, room, engineer, time window, and notes.
2. Request is sent to `POST /api/v1/bookings/`.
3. Backend validates relations and schedule conflicts.
4. Saved booking is returned to the UI.

### Payment update

1. Frontend sends `POST /api/v1/payments/`.
2. Backend saves the payment.
3. Billing service recalculates invoice status.
4. Frontend refreshes invoice and payment data.

## Extension Guidance

### Good places to add logic

- Business rules: service modules inside the relevant Django app
- Serialization and validation: app serializers
- Route wiring: app `urls.py`
- Shared frontend formatting/fetching: `frontend/app/lib/`

### Areas to improve next

- add a dedicated backend health endpoint
- add stronger automated coverage for booking conflicts and payment status transitions
- reduce repeated client-side fetch composition in invoice detail
- formalize role-based permissions per module
