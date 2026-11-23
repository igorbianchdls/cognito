import { appDb } from '@/products/inbox/server/db'
import { optOutByToken, verifyOptoutToken } from '@/products/inbox/server/broadcasts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const page = (title: string, text: string, form = '') => new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="robots" content="noindex"></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f6f6;font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222">
<main style="max-width:420px;margin:24px;background:#fff;border-radius:12px;padding:28px;text-align:center"><h1 style="font-size:20px;margin:0 0 8px">${title}</h1><p style="margin:0 0 20px;color:#555">${text}</p>${form}</main></body></html>`,
{ headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY' } })

/** The link in the e-mail footer: asks to confirm (mail scanners open links on their own). */
export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t')
  if (!verifyOptoutToken(token)) return page('Link inválido', 'Este link de descadastro não é válido.')
  const t = token!.replace(/[^A-Za-z0-9._-]/g, '')
  return page('Parar de receber e-mails?', 'Você não vai mais receber nossos e-mails de divulgação.',
    `<form method="post" action="?t=${t}"><button style="font:inherit;background:#111;color:#fff;border:0;border-radius:8px;padding:10px 18px;cursor:pointer">Confirmar</button></form>`)
}

/** Confirmation, and the one-click unsubscribe of mail apps (List-Unsubscribe-Post). */
export async function POST(request: Request) {
  const ok = await optOutByToken(appDb.service, new URL(request.url).searchParams.get('t'))
  if (!ok) return page('Link inválido', 'Este link de descadastro não é válido.')
  return page('Pronto', 'Você não vai mais receber nossos e-mails de divulgação.')
}
