# Technical Documentation

STEM Studio is now an internal Django Admin application.

## Architecture

- Django Admin is the only main interface.
- Django built-in authentication handles login, staff access, groups, and permissions.
- Business data lives in Django apps: `users`, `clients`, `resources`, `bookings`, `billing`, `notifications`, and `analytics`.
- Reusable billing status logic lives on the `Invoice` and `Payment` models, with `billing.services.recalculate_invoice_status` retained as a compatibility wrapper.

## Removed

- Vite React frontend.
- Node package manifests and build outputs.
- Frontend systemd service.
- DRF serializers, viewsets, routers, and API URLs that existed only for the frontend.
- CORS configuration that existed only for browser API calls from Vite.

## Admin Replacement

The admin now provides searches, filters, ordering, date hierarchy, fieldsets, readonly audit fields, inline payments, and common bulk actions for operational workflows.
