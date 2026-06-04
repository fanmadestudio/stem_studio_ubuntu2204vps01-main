# CLEAN_CODE_CHECKLIST

## Scope Guardrails
- [x] Core business logic preserved
- [x] No feature removal
- [x] No destructive DB changes
- [x] No schema change/migration mutation
- [x] No secret/credential exposure

## Backend (Django)
- [x] App boundaries reviewed (`users`, `clients`, `resources`, `bookings`, `billing`, `notifications`, `analytics`)
- [x] Complex logic moved to service/helper where appropriate
- [x] Serializer/view responsibilities improved (billing + analytics)
- [x] Neon env variable handling reviewed
- [x] Model relationships and migration alignment reviewed
- [ ] Add dedicated tests for service functions (`billing/services.py`, `analytics/services.py`)
- [ ] Introduce consistent service modules per app (future gradual rollout)

## Frontend (Next.js)
- [x] Folder structure reviewed for routes/components/lib
- [x] Repeated utility logic extracted (`formatIdr`, `getStatusClass`)
- [x] Naming consistency improved in helper usage
- [x] API base usage standardized in dashboard health check
- [x] Unused duplication reduced in booking/invoice/staff-equipment pages
- [ ] Replace `invoices` mock seed with real API-based billing flow
- [ ] Consolidate auth session keys into single source of truth

## Database (Neon PostgreSQL)
- [x] Table + relationship mapping documented
- [x] Non-destructive posture maintained
- [x] Data flow mapping documented
- [ ] Evaluate index enhancements for booking overlap queries (documented suggestion only)

## Documentation Deliverables
- [x] `PROJECT_MAPPING.md` created
- [x] `TECHNICAL_DOCUMENTATION.md` created
- [x] `CLEAN_CODE_CHECKLIST.md` created
- [x] API endpoints mapped
- [x] Frontend routes/components mapped
- [x] Model-to-table mapping documented
- [x] Security and performance recommendations documented

## Operational Quality
- [x] Frontend lint passed
- [ ] Backend runtime verification pending local Python availability
