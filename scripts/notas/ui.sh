#!/usr/bin/env bash
# Testes de tela das Notas de ponta a ponta: banco local novo, Next em modo de teste (pessoa fixa "ana" da empresa
# "org_a", só fora de produção) e os roteiros do Playwright. Uso: npm run notas:ui
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$raiz"
porta="${NOTAS_UI_PORTA:-3100}"
url_banco="$(scripts/notas/banco-local.sh)"
pkill -f "next dev -p $porta" 2>/dev/null || true
log="$(mktemp)"
NODE_ENV=development NOTAS_TESTE_USUARIO=ana:org_a SUPABASE_DB_URL="$url_banco" npx next dev -p "$porta" >"$log" 2>&1 &
servidor=$!
trap 'kill $servidor 2>/dev/null || true; pkill -f "next dev -p $porta" 2>/dev/null || true' EXIT
for _ in $(seq 1 90); do curl -sf -o /dev/null "http://localhost:$porta/api/notas/arvore" && break; sleep 2; done
# Primeira visita compila as telas (pode demorar no modo de desenvolvimento).
curl -s -o /dev/null --max-time 240 "http://localhost:$porta/notas" || true
NOTAS_UI_URL="http://localhost:$porta" node --test scripts/notas/ui.test.mjs
