# Project Mapping

## Core Stack

- Backend API: Django (`/backend`)
- Frontend Web: Next.js (`/frontend`)
- Database: PostgreSQL
- Schema management: Django migrations (`/backend/*/migrations`)

## Deployment Assets

- VPS bootstrap: `/scripts/vps_setup_ubuntu2204.sh`
- Systemd services: `/deploy/systemd`

## Scope Note

Artefak non-core (Prisma, Replit, dan CodeSandbox config) dihapus agar repository fokus ke arsitektur produksi inti.
