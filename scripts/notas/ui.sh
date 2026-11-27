#!/usr/bin/env bash
# Testes de tela das Notas de ponta a ponta: banco local novo, Next em modo de teste (pessoa fixa "ana" da empresa
# "org_a", só fora de produção) e os roteiros do Playwright. Uso: npm run notas:ui
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$raiz"
porta="${NOTAS_UI_PORTA:-3100}"
url_banco="$(scripts/notas/banco-local.sh)"
pkill -f "next dev -p $porta" 2>/dev/null || true
# O cache do Turbopack de uma execução anterior faz o navegador recarregar sem parar ("HMR hash mismatch"), e uma
# compilação de produção em .next também atrapalha: começa sempre com o cache de desenvolvimento limpo.
rm -rf .next/dev
if [ -f .next/BUILD_ID ]; then echo "Há uma compilação de produção em .next; mova a pasta antes de rodar os testes de tela." >&2; exit 1; fi
log="$(mktemp)"
NODE_ENV=development NEXT_PUBLIC_NOTAS_TEMPO_REAL=local NOTAS_TESTE_USUARIO=ana:org_a NOTAS_CANAL_SEGREDO=segredo-dos-testes-de-tela SUPABASE_DB_URL="$url_banco" npx next dev -p "$porta" >"$log" 2>&1 &
servidor=$!
trap 'kill $servidor 2>/dev/null || true; pkill -f "next dev -p $porta" 2>/dev/null || true' EXIT
for _ in $(seq 1 90); do curl -sf -o /dev/null "http://localhost:$porta/api/notas/arvore" && break; sleep 2; done
# Primeira visita compila as telas (pode demorar no modo de desenvolvimento).
curl -s -o /dev/null --max-time 240 "http://localhost:$porta/notas" || true
NOTAS_UI_URL="http://localhost:$porta" node --test scripts/notas/ui.test.mjs
