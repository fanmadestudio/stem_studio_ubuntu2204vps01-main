# STEM Studio Codex

Monorepo aplikasi manajemen studio recording.

## Stack Implementasi

- `backend/`: Django 4.2 + Django REST Framework + JWT (`simplejwt`)
- `frontend/`: Next.js 15 (App Router) + React 19 + TypeScript
- API base path: `/api/v1/`
- Database:
  - Default development environment: SQLite tanpa enkripsi (`DB_ENGINE=django.db.backends.sqlite3`)
  - Opsional SQLCipher (`DB_ENGINE=config.db.backends.sqlcipher`)

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

Untuk SQLCipher, install dependency tambahan:

```powershell
py -3 -m pip install -r requirements-sqlcipher.txt
```

Contoh `.env` backend SQLite sudah ada di `backend/.env.example`.

Jika ingin SQLite lokal tanpa enkripsi:

```env
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

Jika ingin SQLCipher:

```env
DB_ENGINE=config.db.backends.sqlcipher
DB_NAME=db.sqlite3
SQLCIPHER_KEY=replace-with-strong-sqlcipher-key
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

### 2) Isi ulang credential default

```powershell
py -3 manage.py seed_credentials
```

## Deploy VPS (Ubuntu 22.04)

```bash
cd stem_studio_codesanbox_sqlite-main
chmod +x scripts/vps_setup_ubuntu2204.sh
PUBLIC_HOST=<VPS_IP> \
SQLCIPHER_KEY='<STRONG_SQLCIPHER_KEY>' \
bash scripts/vps_setup_ubuntu2204.sh
```

## Catatan

- Gunakan Django migration (`makemigrations` + `migrate`) untuk perubahan skema.
- Hindari perubahan skema manual SQL tanpa rekonsiliasi migration.
