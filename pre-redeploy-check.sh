#!/usr/bin/env bash
set -euo pipefail

# Pre-redeploy checks for SIMPELS local mirror.
# Run from repo root: ./pre-redeploy-check.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
  ROOT_DIR="$SCRIPT_DIR"
elif [[ -f "$SCRIPT_DIR/../docker-compose.yml" ]]; then
  ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "[FAIL] Tidak menemukan root repo (docker-compose.yml)"
  exit 1
fi
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

fail() {
  echo "[FAIL] $1"
  exit 1
}

pass() {
  echo "[OK] $1"
}

warn() {
  echo "[WARN] $1"
}

echo "=== PRE-REDEPLOY CHECK ==="

[[ -f "$COMPOSE_FILE" ]] || fail "docker-compose.yml tidak ditemukan"
pass "docker-compose.yml ditemukan"

if [[ ! -f "$BACKEND_DIR/.env.docker" ]]; then
  if [[ -f "$BACKEND_DIR/.env" ]]; then
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.docker"
    warn "Backend/.env.docker tidak ada, dibuat otomatis dari Backend/.env"
  elif [[ -f "$BACKEND_DIR/.env.example" ]]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env.docker"
    warn "Backend/.env.docker tidak ada, dibuat otomatis dari Backend/.env.example"
  else
    fail "Backend/.env.docker tidak ada dan tidak ada sumber fallback"
  fi
fi

docker compose -f "$COMPOSE_FILE" config -q || fail "docker compose config invalid"
pass "docker compose config valid"

if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    warn "Ada perubahan yang belum committed"
  else
    pass "Working tree bersih"
  fi
else
  warn "Git status tidak dapat dibaca (safe.directory), skip working-tree check"
fi

[[ -f "$BACKEND_DIR/.env" ]] || fail "Backend/.env belum ada"
pass "Backend/.env ditemukan"

if command -v php >/dev/null 2>&1; then
  php -l "$BACKEND_DIR/app/Services/Tagihan/TagihanCrudService.php" >/dev/null || fail "PHP lint gagal di TagihanCrudService"
  php -l "$BACKEND_DIR/app/Http/Controllers/TagihanSantriController.php" >/dev/null || fail "PHP lint gagal di TagihanSantriController"
else
  docker compose -f "$COMPOSE_FILE" exec -T backend sh -lc 'php -l /var/www/app/Services/Tagihan/TagihanCrudService.php >/dev/null && php -l /var/www/app/Http/Controllers/TagihanSantriController.php >/dev/null' || fail "PHP lint gagal di container backend"
fi
pass "PHP lint file kritikal lulus"

if docker compose -f "$COMPOSE_FILE" ps --services --filter status=running | grep -qx "backend"; then
  docker compose -f "$COMPOSE_FILE" exec -T backend sh -lc 'cd /var/www && php artisan route:list >/dev/null && php artisan migrate:status >/dev/null' || fail "Artisan route/migrate check gagal"
  pass "Artisan route + migrate status lulus"
else
  warn "Container backend belum running, skip artisan checks"
fi

if [[ -d "$FRONTEND_DIR" && -f "$FRONTEND_DIR/package.json" ]]; then
  if docker compose -f "$COMPOSE_FILE" ps --services --filter status=running | grep -qx "frontend"; then
    docker compose -f "$COMPOSE_FILE" exec -T frontend sh -lc 'npm run -s build >/dev/null' || fail "Frontend build gagal"
    pass "Frontend build lulus"
  else
    warn "Container frontend belum running, skip frontend build"
  fi
else
  warn "Folder frontend/package.json tidak ditemukan, skip frontend checks"
fi

echo "[DONE] Semua check utama selesai"
echo "Checklist manual terakhir:"
echo "1) Uji login + menu Tagihan Santri"
echo "2) Uji create/update pembayaran"
echo "3) Uji endpoint backup sistem"
