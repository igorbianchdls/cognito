#!/usr/bin/env bash
# Testes de tela do Analytics de ponta a ponta: banco local com as migrações, Next em modo de teste (só fora de produção,
# sem login) e uma loja de teste com o otto.js mandando páginas, cliques, flags e gravações.
# Uso: npm run analytics:ui (ANALYTICS_UI_FOTOS=pasta guarda as capturas).
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$raiz"
porta="${ANALYTICS_UI_PORTA:-3102}"
banco="$(scripts/notas/banco-local.sh)"
pkill -f "next dev -p $porta" 2>/dev/null || true
if [ -f .next/BUILD_ID ]; then echo "Há uma compilação de produção em .next; mova a pasta antes de rodar os testes de tela." >&2; exit 1; fi
log="$(mktemp)"
NODE_ENV=development NOTAS_TESTE_USUARIO=ana:org_a SUPABASE_DB_URL="$banco" npx next dev -p "$porta" >"$log" 2>&1 &
servidor=$!
trap 'kill $servidor 2>/dev/null || true; pkill -f "next dev -p $porta" 2>/dev/null || true' EXIT
for _ in $(seq 1 90); do curl -sf -o /dev/null "http://localhost:$porta/api/analytics/dados/sites" && break; sleep 2; done
for tela in analytics analytics/insights/novo analytics/pessoas analytics/mapa analytics/gravacoes analytics/flags; do curl -s -o /dev/null --max-time 300 "http://localhost:$porta/$tela" || true; done
ANALYTICS_UI_URL="http://localhost:$porta" node --test --test-concurrency=1 scripts/analytics/ui.test.mjs
