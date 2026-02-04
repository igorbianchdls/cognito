import { NextRequest } from 'next/server'
import { Composio } from '@composio/core'
import { runQuery } from '@/lib/postgres'

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
  const raw = (toolkit || '').trim()
  const tkLower = raw.toLowerCase()
  if (!raw) return Response.json({ ok: false, error: 'toolkit obrigatório' }, { status: 400 })

  const cookies = parseCookies(req)
  let userId = (providedUserId || cookies['composio_uid'] || '').trim()
  const isNewUser = !userId
  if (!userId) userId = 'user_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  const callbackUrl = `${origin}/integracoes/callback?toolkit=${encodeURIComponent(tkLower)}`

  try {
    // Persist mapping on DB: set composio_user_id (Composio user) for the selected app user (providedUserId)
    try {
      if (providedUserId && providedUserId.trim()) {
        try {
          await runQuery(
            `UPDATE shared.users SET composio_user_id = $2, composio_connected_at = now() WHERE id = $1`,
            [providedUserId.trim(), userId]
          )
        } catch {
          // Fallback in case composio_connected_at doesn't exist
          try {
            await runQuery(
              `UPDATE shared.users SET composio_user_id = $2 WHERE id = $1`,
              [providedUserId.trim(), userId]
            )
          } catch {}
        }
      }
    } catch {}
    const composio = new Composio({ apiKey })
    // If we have a specific Auth Config ID env for this toolkit, prefer Connect Link with explicit callback
    const envKey = `COMPOSIO_${tkLower.toUpperCase()}_AUTH_CONFIG_ID`
    const authConfigId = (process.env as any)[envKey] as string | undefined
    let redirectUrl = ''
    if (authConfigId && authConfigId.trim()) {
      const linkReq = await composio.connectedAccounts.link(userId, authConfigId.trim(), { callbackUrl })
      redirectUrl = linkReq.redirectUrl || ''
    } else {
      const session = await composio.create(userId, { manageConnections: false })
      // Use o slug como foi selecionado na UI (raw), pois alguns toolkits são case-sensitive
      const connectionRequest = await session.authorize(raw)
      redirectUrl = connectionRequest.redirectUrl || ''
    }
    if (!redirectUrl) return Response.json({ ok: false, error: 'redirectUrl vazio' }, { status: 500 })
    const res = Response.json({ ok: true, userId, redirectUrl, callbackUrl })
    // Always set cookie to reflect the selected user
    res.headers.set('Set-Cookie', `composio_uid=${encodeURIComponent(userId)}; Path=/; Max-Age=31536000; SameSite=Lax`)
    return res
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
