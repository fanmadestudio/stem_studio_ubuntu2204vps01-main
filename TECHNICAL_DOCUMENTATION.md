# TECHNICAL_DOCUMENTATION

## Current Project Condition Summary
- The codebase is functional and already organized by bounded Django apps and Next.js routes.
- Core business logic exists and is preserved.
- Main maintainability gaps were code duplication (frontend helpers), dense aggregation/business rules inside endpoint files, and incomplete technical mapping docs.

## Step-by-Step Refactor Plan (Safe Scope)
1. Audit project structure and runtime configuration.
2. Map API, model, and route relationships.
3. Extract non-trivial business/support logic from endpoint files into service/helper modules without behavior changes.
4. Standardize repeated frontend utility logic.
5. Keep schema untouched and avoid destructive operations.
6. Produce documentation artifacts and code-clean checklist.

## Applied Safe Refactors

### Backend
1. `billing` service extraction
- Added `backend/billing/services.py` with `recalculate_invoice_status(invoice)`.
- Updated payment creation flow in serializer to delegate invoice status recalculation.
- Outcome: same invoice status behavior, cleaner serializer responsibility.

2. `analytics` service extraction
- Added `backend/analytics/services.py` with `build_dashboard_payload()`.
- `DashboardAnalyticsView` now only handles request/response orchestration.
- Outcome: same analytics payload structure, easier testability and maintainability.

### Frontend
1. Shared format helper
- Added `frontend/app/lib/format.ts` with `formatIdr`.
- Reused in KPI and invoices pages.

2. Shared status-class helper
- Added `frontend/app/lib/status.ts` with `getStatusClass`.
- Reused in booking, invoices, and staff-equipment pages.

3. API base consistency
- Dashboard health check now uses `getApiBase()` from API library instead of page-local base URL logic.

## Modified Files and Why
- `/backend/billing/services.py` : extracted invoice status transition logic.
- `/backend/billing/serializers.py` : delegated status update to service.
- `/backend/analytics/services.py` : extracted dashboard aggregation logic.
- `/backend/analytics/views.py` : reduced to controller-level endpoint.
- `/frontend/app/lib/format.ts` : centralized IDR formatting.
- `/frontend/app/lib/status.ts` : centralized status CSS mapping.
- `/frontend/app/booking/page.tsx` : replaced duplicated helpers with shared utilities.
- `/frontend/app/invoices/page.tsx` : replaced duplicated helpers with shared utilities.
- `/frontend/app/staff-equipment/page.tsx` : replaced duplicated helpers with shared utilities.
- `/frontend/app/components/kpi-row.tsx` : reused shared currency formatter.
- `/frontend/app/page.tsx` : standardized API base resolution.

## Before/After Refactor Summary

### Billing status update
Before:
- `PaymentSerializer.create()` both created payment and contained invoice status transition logic.

After:
- `PaymentSerializer.create()` creates payment and calls `recalculate_invoice_status()` service.

Benefit:
- Separation of concerns, easier unit tests, less serializer complexity.

### Analytics endpoint
Before:
- `DashboardAnalyticsView.get()` contained full monthly aggregation and transformation logic.

After:
- View delegates to `build_dashboard_payload()` service and returns response.

Benefit:
- Thinner view layer and reusable analytics composition function.

### Frontend helper duplication
Before:
- Multiple pages duplicated `statusClass` and currency formatting functions.

After:
- Shared helpers in `/frontend/app/lib` imported by affected pages/components.

Benefit:
- Naming consistency, less copy-paste risk, simpler maintenance.

## Database / Neon Configuration Review
- Neon PostgreSQL env support is correctly implemented in `backend/config/settings.py`.
- `DB_SSLMODE=require` is supported and aligned with Neon requirements.
- Migrations remain the source of truth; no schema mutation performed in this refactor.

## API Communication Pattern Review (Frontend -> Django)
- Centralized in `frontend/app/lib/api.ts` with:
  - base URL resolver
  - token header injection
  - JSON parsing and error propagation
  - support for paginated and non-paginated lists
- Refactor kept this pattern and made dashboard health-check consistent with it.

## Migration and Model Relationship Notes
- Current migrations and model relationships align with Prisma mirror and SQL reference.
- No destructive DB operation performed.
- No model field/type/schema change applied.

## Technical Debt and Risks
- Invoices page still uses seeded mock data instead of live API.
- Auth/session storage uses multiple key aliases, increasing risk of stale identity state.
- Permission posture on analytics endpoint may be too open for production.
- Automated tests are minimal for critical booking/billing paths.

## Validation Performed
- Frontend lint: `npm run lint` passed.
- Backend compile check could not run because Python runtime is unavailable in this terminal environment.
