#!/usr/bin/env bash
set -euo pipefail

# Setup local environment to mirror server behavior as close as possible.
# Usage:
#   ./local-mirror-setup.sh
#   ./local-mirror-setup.sh --import-sql /path/to/dump.sql
#   ./local-mirror-setup.sh --import-sql /path/to/dump.sql.gz

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
  ROOT_DIR="$SCRIPT_DIR"
elif [[ -f "$SCRIPT_DIR/../docker-compose.yml" ]]; then
  ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "[ERROR] Tidak menemukan root repo (docker-compose.yml)"
  exit 1
fi
BACKEND_DIR="$ROOT_DIR/Backend"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
IMPORT_SQL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --import-sql)
      IMPORT_SQL="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[ERROR] docker-compose.yml tidak ditemukan di root repo: $ROOT_DIR"
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  if [[ -f "$BACKEND_DIR/.env.example" ]]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "[OK] Membuat Backend/.env dari .env.example"
  else
    echo "[ERROR] Backend/.env.example tidak ditemukan"
    exit 1
  fi
fi

if [[ ! -f "$BACKEND_DIR/.env.docker" ]]; then
  cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.docker"
  echo "[OK] Membuat Backend/.env.docker dari Backend/.env"
fi

set_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

# Baseline local settings to reduce production mismatch.
set_env "$BACKEND_DIR/.env" "APP_ENV" "local"
set_env "$BACKEND_DIR/.env" "APP_DEBUG" "true"
set_env "$BACKEND_DIR/.env" "APP_URL" "http://localhost:8001"
set_env "$BACKEND_DIR/.env" "DB_CONNECTION" "mysql"
set_env "$BACKEND_DIR/.env" "DB_HOST" "db"
set_env "$BACKEND_DIR/.env" "DB_PORT" "3306"
set_env "$BACKEND_DIR/.env" "DB_DATABASE" "simpels_db"
set_env "$BACKEND_DIR/.env" "DB_USERNAME" "simpels"
set_env "$BACKEND_DIR/.env" "DB_PASSWORD" "secret"
set_env "$BACKEND_DIR/.env" "QUEUE_CONNECTION" "database"
set_env "$BACKEND_DIR/.env" "CACHE_DRIVER" "redis"
set_env "$BACKEND_DIR/.env" "CACHE_STORE" "redis"
set_env "$BACKEND_DIR/.env" "SESSION_DRIVER" "redis"
set_env "$BACKEND_DIR/.env" "REDIS_HOST" "redis"
set_env "$BACKEND_DIR/.env" "REDIS_PASSWORD" "redispassword"
set_env "$BACKEND_DIR/.env" "REDIS_PORT" "6379"
set_env "$BACKEND_DIR/.env" "LOG_CHANNEL" "stderr"
set_env "$BACKEND_DIR/.env" "LOG_LEVEL" "debug"
set_env "$BACKEND_DIR/.env" "TZ" "Asia/Jakarta"

# Keep docker env aligned with local baseline to reduce runtime mismatch.
set_env "$BACKEND_DIR/.env.docker" "APP_ENV" "local"
set_env "$BACKEND_DIR/.env.docker" "APP_DEBUG" "true"
set_env "$BACKEND_DIR/.env.docker" "APP_URL" "http://localhost:8001"
set_env "$BACKEND_DIR/.env.docker" "DB_CONNECTION" "mysql"
set_env "$BACKEND_DIR/.env.docker" "DB_HOST" "db"
set_env "$BACKEND_DIR/.env.docker" "DB_PORT" "3306"
set_env "$BACKEND_DIR/.env.docker" "DB_DATABASE" "simpels_db"
set_env "$BACKEND_DIR/.env.docker" "DB_USERNAME" "simpels"
set_env "$BACKEND_DIR/.env.docker" "DB_PASSWORD" "secret"
set_env "$BACKEND_DIR/.env.docker" "QUEUE_CONNECTION" "database"
set_env "$BACKEND_DIR/.env.docker" "CACHE_DRIVER" "redis"
set_env "$BACKEND_DIR/.env.docker" "CACHE_STORE" "redis"
set_env "$BACKEND_DIR/.env.docker" "SESSION_DRIVER" "redis"
set_env "$BACKEND_DIR/.env.docker" "REDIS_HOST" "redis"
set_env "$BACKEND_DIR/.env.docker" "REDIS_PASSWORD" "redispassword"
set_env "$BACKEND_DIR/.env.docker" "REDIS_PORT" "6379"
set_env "$BACKEND_DIR/.env.docker" "LOG_CHANNEL" "stderr"
set_env "$BACKEND_DIR/.env.docker" "LOG_LEVEL" "debug"
set_env "$BACKEND_DIR/.env.docker" "TZ" "Asia/Jakarta"

echo "[OK] Baseline env local selesai di Backend/.env"

echo "[STEP] Menyalakan service inti (db, redis, backend, nginx) ..."
docker compose -f "$COMPOSE_FILE" up -d db redis backend nginx >/dev/null

echo "[STEP] Menunggu DB siap ..."
for i in {1..60}; do
  if docker compose -f "$COMPOSE_FILE" exec -T db sh -lc 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent' >/dev/null 2>&1; then
    echo "[OK] DB ready"
    break
  fi
  if [[ $i -eq 60 ]]; then
    echo "[ERROR] DB tidak ready setelah 60 detik"
    exit 1
  fi
  sleep 1
done

if [[ -n "$IMPORT_SQL" ]]; then
  if [[ ! -f "$IMPORT_SQL" ]]; then
    echo "[ERROR] File dump tidak ditemukan: $IMPORT_SQL"
    exit 1
  fi

  echo "[STEP] Import database dari: $IMPORT_SQL"
  if [[ "$IMPORT_SQL" == *.gz ]]; then
    gunzip -c "$IMPORT_SQL" | docker compose -f "$COMPOSE_FILE" exec -T db sh -lc 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
  else
    docker compose -f "$COMPOSE_FILE" exec -T db sh -lc 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "$IMPORT_SQL"
  fi
  echo "[OK] Import database selesai"
fi

echo "[STEP] Sinkronisasi cache Laravel ..."
docker compose -f "$COMPOSE_FILE" exec -T backend sh -lc 'cd /var/www && php artisan optimize:clear && php artisan key:generate --force >/dev/null 2>&1 || true && php artisan config:cache && php artisan route:cache' >/dev/null

echo "[DONE] Local mirror setup selesai"
echo "- Backend URL : http://localhost:8001"
echo "- Next step   : jalankan ./pre-redeploy-check.sh sebelum push/redeploy"
