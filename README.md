# STEM Studio

Monorepo aplikasi manajemen studio recording.

## Stack Implementasi

- `backend/`: Django 4.2 + Django REST Framework + JWT (`simplejwt`)
- `frontend/`: Next.js 15 (App Router) + React 19 + TypeScript
- API base path: `/api/v1/`
- Database: Supabase PostgreSQL (`DB_ENGINE=django.db.backends.postgresql`)

## Fitur yang Sudah Diimplementasikan

- Login JWT (`/login`) dan penyimpanan token di `localStorage`
- Dashboard (`/`) dengan KPI, tren, aktivitas booking, dan health API
- Manajemen Client (`/clients`)
- Booking + konflik jadwal dari backend (`/booking`)
- Manajemen Room dari halaman booking (create/delete)
- Staff & Equipment CRUD (`/staff-equipment`)
- Invoices list (`/invoices`)
- Invoice detail + riwayat pembayaran + export PDF via print (`/invoices/[id]`)
- Settings profil user (`/settings`)

## Struktur Folder

- `backend/` Django project + apps + migrations
- `frontend/` Next.js app
- `deploy/systemd/` service unit backend dan frontend
- `scripts/vps_setup_ubuntu2204.sh` setup VPS Ubuntu 22.04

## API Utama (Aktif)

- Auth:
  - `POST /api/v1/auth/token/`
  - `POST /api/v1/auth/token/refresh/`
  - `GET/PATCH /api/v1/auth/profile/`
  - `POST /api/v1/auth/register/`
- Master:
  - `/api/v1/clients/`
  - `/api/v1/rooms/`
  - `/api/v1/engineers/`
  - `/api/v1/equipment/`
- Transaksi:
  - `/api/v1/bookings/`
  - `/api/v1/invoices/`
  - `/api/v1/payments/`
- Lainnya:
  - `/api/v1/notifications/`
  - `GET /api/v1/analytics/dashboard/`

## Jalankan Lokal

### 1) Backend (Django)

```powershell
cd backend
Copy-Item .env.example .env
py -3 -m pip install -r requirements.txt
py -3 manage.py migrate
py -3 manage.py seed_credentials
py -3 manage.py runserver 0.0.0.0:8000
```

Contoh `.env` backend (Supabase PostgreSQL) sudah ada di `backend/.env.example`.

Isi dengan connection credentials dari project Supabase. Minimal yang perlu diubah:

```env
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-supabase-db-password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_SSLMODE=require
```

### 2) Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
```

Opsional `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Jika env ini tidak diisi, frontend otomatis pakai `http://<hostname>:8000`.

## Default Credential Seed

Command:

```powershell
cd backend
py -3 manage.py seed_credentials
```

Credential:

- `admin@stemstudio.com / 4dm1nst3mstvd10`
- `staff@stemstudio.com / St4ffst3mstvd10`

`seed_credentials` aman dijalankan berulang (update-or-create).

## Playbook Data Singkat

Jalankan dari folder `backend/`.

### 1) Reset semua data

```powershell
py -3 manage.py flush --no-input
```

Untuk mulai benar-benar kosong di Supabase, arahkan `.env` ke database/project Supabase baru lalu jalankan `py -3 manage.py migrate`.

### 2) Isi ulang credential default

```powershell
py -3 manage.py seed_credentials
```

## Deploy VPS (Ubuntu 22.04)

```bash
cd stem_studio_-main
chmod +x scripts/vps_setup_ubuntu2204.sh
PUBLIC_HOST=<VPS_IP> \
DB_NAME=postgres \
DB_USER=postgres.<SUPABASE_PROJECT_REF> \
DB_PASSWORD='<SUPABASE_DB_PASSWORD>' \
DB_HOST=db.<SUPABASE_PROJECT_REF>.supabase.co \
DB_PORT=5432 \
DB_SSLMODE=require \
bash scripts/vps_setup_ubuntu2204.sh
```

## Catatan

- Gunakan Django migration (`makemigrations` + `migrate`) untuk perubahan skema.
- Hindari perubahan skema manual SQL tanpa rekonsiliasi migration.
