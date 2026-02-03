import { NextRequest } from 'next/server'
import { Composio } from '@composio/core'

export const runtime = 'nodejs'

function getOrigin(req: NextRequest) {
  try { return new URL(req.url).origin } catch { return process.env.NEXT_PUBLIC_BASE_URL || '' }
}

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = req.headers.get('cookie') || ''
  raw.split(';').forEach(p => {
    const idx = p.indexOf('=')
    if (idx > -1) {
      const k = p.slice(0, idx).trim()
      const v = p.slice(idx + 1)
      if (k) out[k] = decodeURIComponent(v)
    }
  })
  return out
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req)
  const { toolkit, userId: providedUserId } = await req.json().catch(() => ({})) as { toolkit?: string; userId?: string }

  const apiKey = process.env.COMPOSIO_API_KEY || ''
  if (!apiKey) return Response.json({ ok: false, error: 'COMPOSIO_API_KEY ausente' }, { status: 400 })
  const tk = (toolkit || '').trim().toLowerCase()
  if (!tk) return Response.json({ ok: false, error: 'toolkit obrigatório' }, { status: 400 })

  const cookies = parseCookies(req)
  let userId = (providedUserId || cookies['composio_uid'] || '').trim()
  const isNewUser = !userId
  if (!userId) userId = 'user_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  const callbackUrl = `${origin}/integracoes/callback?toolkit=${encodeURIComponent(tk)}`

  try {
    const composio = new Composio({ apiKey })
    const session = await composio.create(userId, { manageConnections: false })
    const connectionRequest = await session.authorize(tk)
    // Fallback: if authorize didn’t set callback, keep default
    const redirectUrl = connectionRequest.redirectUrl || ''
    if (!redirectUrl) return Response.json({ ok: false, error: 'redirectUrl vazio' }, { status: 500 })
    const res = Response.json({ ok: true, userId, redirectUrl, callbackUrl })
    if (isNewUser) res.headers.set('Set-Cookie', `composio_uid=${encodeURIComponent(userId)}; Path=/; Max-Age=31536000; SameSite=Lax`)
    return res
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

