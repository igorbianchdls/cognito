#!/usr/bin/env bash
# Testes de tela do Editor de vídeo de ponta a ponta: Next em modo de teste (só fora de produção, sem login), mídias de
# exemplo geradas na hora com o ffmpeg e os roteiros do Playwright (carregar, linha do tempo, prévia, exportar).
# Uso: npm run editor:ui. Tudo fica no navegador (sem NEXT_PUBLIC_EDITOR_REMOTE), então não precisa de banco.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$raiz"
porta="${EDITOR_UI_PORTA:-3101}"
command -v ffmpeg >/dev/null || { echo "Os testes do Editor precisam do ffmpeg (para gerar as mídias de exemplo)." >&2; exit 1; }
midia="$(mktemp -d)"
ffmpeg -loglevel error -y -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=8" -f lavfi -i "sine=frequency=440:duration=8" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$midia/vertical.mp4"
ffmpeg -loglevel error -y -f lavfi -i "smptehdbars=size=1920x1080:rate=30:duration=6" -f lavfi -i "sine=frequency=660:duration=6" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$midia/paisagem.mp4"
ffmpeg -loglevel error -y -f lavfi -i "mandelbrot=size=1080x1350:rate=1" -frames:v 1 "$midia/foto.png"
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=0.3*sin(2*PI*220*t)|0.3*sin(2*PI*330*t):d=20" -c:a libmp3lame "$midia/musica.mp3"
pkill -f "next dev -p $porta" 2>/dev/null || true
rm -rf .next/dev
if [ -f .next/BUILD_ID ]; then echo "Há uma compilação de produção em .next; mova a pasta antes de rodar os testes de tela." >&2; exit 1; fi
log="$(mktemp)"
NODE_ENV=development NOTAS_TESTE_USUARIO=ana:org_a NEXT_PUBLIC_EDITOR_REMOTE= npx next dev -p "$porta" >"$log" 2>&1 &
servidor=$!
trap 'kill $servidor 2>/dev/null || true; pkill -f "next dev -p $porta" 2>/dev/null || true; rm -rf "$midia"' EXIT
for _ in $(seq 1 90); do curl -sf -o /dev/null "http://localhost:$porta/editor" && break; sleep 2; done
curl -s -o /dev/null --max-time 300 "http://localhost:$porta/editor/aquecer" || true
EDITOR_UI_URL="http://localhost:$porta" EDITOR_UI_MIDIA="$midia" node --test scripts/editor/ui.test.mjs
