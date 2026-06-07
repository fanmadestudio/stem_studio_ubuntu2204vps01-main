# API Reference

## Base URL

- Local backend base: `http://127.0.0.1:8000`
- API prefix: `/api/v1/`

All authenticated endpoints expect a Django bearer token unless noted otherwise.

## Authentication

Authentication is handled through the API login endpoint. The frontend signs in, stores the access token, and sends:

```http
Authorization: Bearer <access_token>
```

## Endpoint Groups

### Profile and users

#### `POST /api/v1/auth/login/`

Authenticates a Django user and returns a DRF token plus profile data.

Example payload:

```json
{
  "email": "admin@stemstudio.com",
  "password": "4dm1nst3mstvd10"
}
```

#### `GET /api/v1/auth/profile/`

Returns the authenticated Django user profile.

Typical fields:

- `id`
- `email`
- `first_name`
- `last_name`
- `role`

#### `PATCH /api/v1/auth/profile/`

Updates the current profile.

Common payload:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "password": "new-password-if-supported"
}
```

#### `GET|POST /api/v1/users/`
#### `GET|PATCH|DELETE /api/v1/users/{id}/`

Admin-facing user CRUD surface exposed through DRF router conventions.

### Clients

#### `GET /api/v1/clients/`

Returns a paginated or direct list of clients.

Typical fields:

- `id`
- `user`
- `user_email`
- `first_name`
- `last_name`
- `phone`
- `notes`
- `created_at`

#### `POST /api/v1/clients/`

Common payload:

```json
{
  "email": "client@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "08123456789",
  "notes": ""
}
```

#### `GET|PATCH|DELETE /api/v1/clients/{id}/`

### Rooms

#### `GET /api/v1/rooms/`
#### `POST /api/v1/rooms/`

Example payload:

```json
{
  "name": "Room A",
  "price": 1500000
}
```

#### `GET|PATCH|DELETE /api/v1/rooms/{id}/`

### Engineers

#### `GET /api/v1/engineers/`
#### `POST /api/v1/engineers/`

Example payload:

```json
{
  "name": "Raka",
  "role": "engineer",
  "is_available": true
}
```

#### `GET|PATCH|DELETE /api/v1/engineers/{id}/`

### Equipment

#### `GET /api/v1/equipment/`
#### `POST /api/v1/equipment/`

Example payload:

```json
{
  "name": "Microphone A",
  "status": "ready"
}
```

Allowed statuses:

- `ready`
- `maintenance`
- `busy`

#### `GET|PATCH|DELETE /api/v1/equipment/{id}/`

### Bookings

#### `GET /api/v1/bookings/`

Returns booking records ordered by descending `start_time`.

Typical fields:

- `id`
- `client`
- `room`
- `engineer`
- `equipment`
- `start_time`
- `end_time`
- `notes`
- `status`

#### `POST /api/v1/bookings/`

Example payload:

```json
{
  "client": 1,
  "room": 2,
  "engineer": 3,
  "equipment": [],
  "start_time": "2026-06-07T10:00:00.000Z",
  "end_time": "2026-06-07T12:00:00.000Z",
  "notes": "Optional notes",
  "status": "pending"
}
```

Allowed statuses:

- `pending`
- `confirmed`
- `completed`
- `cancelled`

#### `GET|PATCH|DELETE /api/v1/bookings/{id}/`

Notes:

- backend is expected to reject overlapping bookings based on business rules
- frontend uses `PATCH` mainly for status transitions

### Invoices

#### `GET /api/v1/invoices/`

Typical fields:

- `id`
- `booking`
- `total`
- `status`
- `issued_at`
- `paid_amount`

Allowed statuses:

- `unpaid`
- `partial`
- `paid`
- `cancelled`

#### `POST /api/v1/invoices/`

Example payload:

```json
{
  "booking": 10,
  "total": 2500000
}
```

#### `GET|PATCH|DELETE /api/v1/invoices/{id}/`

### Payments

#### `GET /api/v1/payments/`

Returns payment history records.

Typical fields:

- `id`
- `invoice`
- `amount`
- `paid_at`
- `note`

#### `POST /api/v1/payments/`

Example payload:

```json
{
  "invoice": 5,
  "amount": 500000,
  "note": "Down payment"
}
```

Behavior:

- creating a payment triggers invoice status recalculation

#### `GET|PATCH|DELETE /api/v1/payments/{id}/`

### Notifications

#### `GET /api/v1/notifications/`
#### `POST /api/v1/notifications/`
#### `GET|PATCH|DELETE /api/v1/notifications/{id}/`

Notification types:

- `booking_reminder`
- `payment_reminder`
- `system`

Notification statuses:

- `pending`
- `sent`
- `failed`

### Analytics

#### `GET /api/v1/analytics/dashboard/`

Dashboard-focused aggregate endpoint used by the homepage for operational reporting and health checking.

## Frontend Usage Notes

- `frontend/app/lib/api.ts` automatically injects bearer tokens.
- `apiFetchList()` handles both array and paginated DRF responses.
- Errors are surfaced as raw response text, so backend JSON validation messages can appear directly in the UI.

## Gaps In The Current API Shape

- No dedicated `/health` endpoint.
- No single aggregate invoice-detail endpoint; frontend composes that view with multiple requests.
- Role-specific permission behavior is only partially documented and should be verified before production hardening.
