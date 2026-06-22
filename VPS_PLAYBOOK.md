# STEM Studio VPS Playbook

This file is only for operating the app on a VPS. It explains how to update the repository, rebuild the app, run Django checks, restart services, inspect logs, and roll back when needed.

## Defaults

| Item | Value |
|---|---|
| OS target | Ubuntu 22.04 |
| Project path | `/home/<user>/stem_studio` |
| Branch | `codex/fix-vite-api-proxy-clean` |
| Remote | `target-rewrite` if available, otherwise `origin` |
| Backend service | `stem-backend` |
| Frontend service | `stem-frontend` |
| Backend venv | `backend/.venv` |

Replace `<user>`, `<domain>`, and paths with the real VPS values.

## First-Time VPS Setup

Use this only when the VPS does not have the app configured yet.

```bash
ssh <user>@<vps-ip-or-domain>
cd /home/<user>
git clone <repository-url> stem_studio
cd stem_studio
chmod +x scripts/vps_setup_ubuntu2204.sh
PUBLIC_HOST=<domain> \
SQLCIPHER_KEY='<strong-sqlcipher-key>' \
bash scripts/vps_setup_ubuntu2204.sh
sudo certbot --nginx -d <domain>
```

After setup, create or seed an admin account:

```bash
cd /home/<user>/stem_studio/backend
./.venv/bin/python manage.py seed_credentials
# or
./.venv/bin/python manage.py createsuperuser
```

## Default Update From GitHub

Use this for normal VPS updates after code is pushed to GitHub.

### 1. SSH And Enter Project

```bash
ssh <user>@<vps-ip-or-domain>
cd /home/<user>/stem_studio
```

### 2. Check Local State

```bash
git status --short --branch
```

If files are modified directly on the VPS, stop and back them up before pulling.

### 3. Fetch Latest Code

```bash
git fetch --all --prune
git remote -v
```

### 4. Pull The Deploy Branch

If the VPS has `target-rewrite`:

```bash
git checkout codex/fix-vite-api-proxy-clean
git pull --ff-only target-rewrite codex/fix-vite-api-proxy-clean
```

If the VPS only has `origin`:

```bash
git checkout codex/fix-vite-api-proxy-clean
git pull --ff-only origin codex/fix-vite-api-proxy-clean
```

If the branch does not exist locally yet:

```bash
git checkout -b codex/fix-vite-api-proxy-clean target-rewrite/codex/fix-vite-api-proxy-clean
```

Use `origin/codex/fix-vite-api-proxy-clean` instead if needed.

### 5. Update Backend

```bash
cd backend
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python manage.py check
./.venv/bin/python manage.py migrate
./.venv/bin/python manage.py test users
```

### 6. Rebuild Frontend

```bash
cd ../frontend
npm ci
npm run build
```

### 7. Restart Services

```bash
sudo systemctl restart stem-backend
sudo systemctl restart stem-frontend
```

### 8. Verify Services

```bash
sudo systemctl status stem-backend --no-pager
sudo systemctl status stem-frontend --no-pager
```

### 9. Check Logs

```bash
sudo journalctl -u stem-backend -n 100 --no-pager
sudo journalctl -u stem-frontend -n 100 --no-pager
```

For live logs:

```bash
sudo journalctl -u stem-backend -f
sudo journalctl -u stem-frontend -f
```

### 10. Browser Verification

Open:

```text
https://<domain>/login
```

Sign in with an existing Django user. Check that dashboard data loads and logout returns to `/login`.

If the browser still has old token-login data, clear site data/cookies for the domain and try again.

## Environment Checks

Backend env:

```bash
cd /home/<user>/stem_studio/backend
cat .env
```

Important production values:

```env
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=<domain>,localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=https://<domain>
DJANGO_CSRF_TRUSTED_ORIGINS=https://<domain>
DJANGO_SECURE_PROXY_SSL_HEADER=1
DJANGO_SECURE_SSL_REDIRECT=1
DJANGO_SESSION_COOKIE_SECURE=1
DJANGO_CSRF_COOKIE_SECURE=1
```

Frontend env:

```bash
cd /home/<user>/stem_studio/frontend
cat .env.production
```

For same-domain Nginx proxy deployment, `VITE_API_BASE_URL` can be empty so the frontend calls `/api/...` on the same host.

## Nginx Commands

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

## Rollback

Use this if the latest deploy fails and you need to return to the previous good commit.

```bash
cd /home/<user>/stem_studio
git log --oneline -5
git reset --hard <previous-good-commit>

cd backend
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python manage.py migrate

cd ../frontend
npm ci
npm run build

sudo systemctl restart stem-backend stem-frontend
sudo journalctl -u stem-backend -n 100 --no-pager
sudo journalctl -u stem-frontend -n 100 --no-pager
```

## Useful Maintenance Commands

```bash
cd /home/<user>/stem_studio/backend
./.venv/bin/python manage.py check
./.venv/bin/python manage.py migrate
./.venv/bin/python manage.py seed_credentials
```

```bash
df -h
free -m
sudo systemctl list-units --failed
```
