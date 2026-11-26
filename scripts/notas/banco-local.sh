#!/usr/bin/env bash
# Sobe um Postgres local (porta 54329) só para os testes de integração das Notas e dos Vídeos e aplica as migrações.
# Uso: scripts/notas/banco-local.sh  → imprime a URL para NOTAS_TEST_DB_URL. Precisa do Postgres 16 instalado.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
bin="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
dados="${NOTAS_PG_DIR:-/tmp/notas-pg-teste}"
porta="${NOTAS_PG_PORTA:-54329}"
como() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
como "$bin/pg_ctl -D $dados stop -m fast" >/dev/null 2>&1 || true
rm -rf "$dados"; mkdir -p "$dados"; [ "$(id -u)" = 0 ] && chown postgres "$dados"
como "$bin/initdb -D $dados -U postgres -A trust" >/dev/null
como "$bin/pg_ctl -D $dados -o '-p $porta -k /tmp' -l $dados/log.txt start" >/dev/null
url="postgresql://postgres@localhost:$porta/postgres"
psql -q -v ON_ERROR_STOP=1 "$url" -f "$raiz/scripts/notas/supabase-local.sql" >/dev/null
psql -q "$url" -c "CREATE SCHEMA marketing; GRANT USAGE ON SCHEMA marketing TO authenticated, service_role;" >/dev/null
for m in "$raiz"/supabase/migrations/*marketing_videos*.sql "$raiz"/supabase/migrations/*notas*.sql; do psql -q -v ON_ERROR_STOP=1 "$url" -f "$m" >/dev/null; done
echo "$url"
