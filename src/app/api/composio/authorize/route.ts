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
  const { toolkit, authConfigId: providedAuthConfigId, callbackUrl: providedCallbackUrl } = await req.json().catch(() => ({})) as { toolkit?: string; authConfigId?: string; callbackUrl?: string }

  const apiKey = process.env.COMPOSIO_API_KEY || ''
  if (!apiKey) {
    return Response.json({ ok: false, error: 'COMPOSIO_API_KEY ausente' }, { status: 400 })
  }

  // Resolve user id from cookie or create new
  const cookies = parseCookies(req)
  let userId = cookies['composio_uid']
  const isNewUser = !userId
  if (!userId) userId = 'user_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  // Resolve auth config id
  let authConfigId = (providedAuthConfigId || '').toString().trim()
  if (!authConfigId) {
    const tk = (toolkit || '').toLowerCase().trim()
    if (tk === 'gmail') authConfigId = (process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID || '').trim()
  }
  if (!authConfigId) {
    return Response.json({ ok: false, error: 'authConfigId ausente (ou toolkit não suportado sem env)' }, { status: 400 })
  }

  const cbDefault = `${origin}/composio/callback`
  const callbackUrl = (providedCallbackUrl || process.env.COMPOSIO_CALLBACK_URL || cbDefault).toString()

  try {
    const composio = new Composio({ apiKey })
    const connectionRequest = await composio.connectedAccounts.link(userId, authConfigId, { callbackUrl })
    const body = { ok: true, userId, connectionRequestId: connectionRequest.id, redirectUrl: connectionRequest.redirectUrl }
    const res = Response.json(body)
    if (isNewUser) {
      res.headers.set('Set-Cookie', `composio_uid=${encodeURIComponent(userId)}; Path=/; Max-Age=31536000; SameSite=Lax`)
    }
    return res
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

