# STEM Studio

Monorepo aplikasi manajemen studio recording.

## Stack Implementasi

- `backend/`: Django 4.2 + Django REST Framework
- `frontend/`: Next.js 15 (App Router) + React 19 + TypeScript
- API base path: `/api/v1/`
- Database: Supabase PostgreSQL (`DB_ENGINE=django.db.backends.postgresql`)
- Authentication: Supabase Auth (email/password) with Django role mapping (`admin`, `staff`, `client`)

## Fitur yang Sudah Diimplementasikan

- Login Supabase Auth (`/login`) dengan sesi yang disinkronkan ke frontend
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
  - `GET/PATCH /api/v1/auth/profile/`
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
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-supabase-db-password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_SSLMODE=require
```

Atau jika kamu sudah punya 1 connection string dari Supabase, backend sekarang juga bisa langsung pakai:

```env
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:5432/postgres?sslmode=require
```

Untuk environment seperti CodeSandbox yang biasanya IPv4-only, lebih aman pakai **Supavisor session pooler** (`*.pooler.supabase.com:5432`) daripada direct host `db.<project-ref>.supabase.co:5432`, kecuali project Supabase kamu memang sudah support IPv4 direct connection.

### 2) Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
```

Opsional `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Jika env ini tidak diisi, frontend otomatis pakai `http://<hostname>:8000`.

## Deploy di CodeSandbox

Cara paling simpel untuk repo ini di CodeSandbox adalah menjalankan **frontend** dan **backend** dalam 1 Devbox, dengan backend di port `8000` dan frontend di port `3000`.

### 1) Import repo ke CodeSandbox

- Buka CodeSandbox lalu pilih import dari GitHub/repo zip.
- Tunggu dependency scanning selesai.

### 2) Siapkan backend env

- Buka folder `backend/`.
- Copy `backend/.env.example` jadi `backend/.env`.
- Isi **salah satu** cara berikut:

Opsi A — paling praktis, pakai 1 connection string:

```env
DJANGO_SECRET_KEY=ganti-dengan-secret-random
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=*
DJANGO_CORS_ALLOW_ALL_ORIGINS=1
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:5432/postgres?sslmode=require
```

Opsi B — pakai split variables:

```env
DJANGO_SECRET_KEY=ganti-dengan-secret-random
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=*
DJANGO_CORS_ALLOW_ALL_ORIGINS=1
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-password
DB_HOST=aws-0-your-region.pooler.supabase.com
DB_PORT=5432
DB_SSLMODE=require
```

### 3) Jalankan backend

Di terminal 1:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_credentials
python manage.py runserver 0.0.0.0:8000
```

Kalau migrate sukses, berarti koneksi ke Supabase sudah benar.

### 4) Siapkan frontend env

- Buka folder `frontend/`.
- Buat file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-port-url-dari-codesandbox>
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Kalau CodeSandbox memberi URL port backend seperti `https://abcd-8000.csb.app`, isi:

```env
NEXT_PUBLIC_API_BASE_URL=https://abcd-8000.csb.app
```

### 5) Jalankan frontend

Di terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Lalu buka preview port `3000`.

### 6) Izinkan origin frontend ke backend

Kalau login/API kena error CORS atau CSRF, tambahkan domain preview frontend CodeSandbox ke `backend/.env`:

```env
DJANGO_CORS_ALLOWED_ORIGINS=https://<frontend-url-codesandbox>
DJANGO_CSRF_TRUSTED_ORIGINS=https://<frontend-url-codesandbox>
```

Kalau masih mode `DJANGO_DEBUG=1` dan `DJANGO_CORS_ALLOW_ALL_ORIGINS=1`, biasanya ini tidak diperlukan untuk testing awal.

### 7) Test login

- Buka preview frontend.
- Buat 2 akun Supabase Auth dengan email yang sama seperti user Django seed:
  - `admin@stemstudio.com`
  - `staff@stemstudio.com`
- Login memakai password akun Supabase tersebut.

### 8) Kalau backend gagal connect ke Supabase

Cek hal berikut:

- pakai **pooler host** `*.pooler.supabase.com`, bukan `db.*.supabase.co`, jika CodeSandbox tidak support direct IPv6;
- port untuk persistent app traffic adalah `5432` pada **session pooler**;
- tambahkan `?sslmode=require` pada `DATABASE_URL`;
- pastikan password yang dipakai adalah password database Supabase, bukan anon/service API key.

## Default Credential Seed

Command:

```powershell
cd backend
py -3 manage.py seed_credentials
```

Credential role di database Django:

- `admin@stemstudio.com / 4dm1nst3mstvd10`
- `staff@stemstudio.com / St4ffst3mstvd10`

`seed_credentials` aman dijalankan berulang (update-or-create).
Kalau memakai Supabase Auth, buat akun Auth dengan email yang sama agar role lama tetap terhubung otomatis saat login pertama.

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
