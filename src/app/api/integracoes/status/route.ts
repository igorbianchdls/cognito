import { NextRequest } from 'next/server'
import { Composio } from '@composio/core'

export const runtime = 'nodejs'

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

export async function GET(req: NextRequest) {
  const apiKey = process.env.COMPOSIO_API_KEY || ''
  if (!apiKey) return Response.json({ ok: false, error: 'COMPOSIO_API_KEY ausente' }, { status: 400 })
  const cookies = parseCookies(req)
  const search = req.nextUrl.searchParams
  const toolkit = (search.get('toolkit') || '').trim().toLowerCase()
  const userId = (search.get('userId') || cookies['composio_uid'] || '').trim()
  if (!userId) return Response.json({ ok: false, error: 'userId ausente (cookie composio_uid não definido)' }, { status: 400 })
  try {
    const composio = new Composio({ apiKey })
    const session = await composio.create(userId, { manageConnections: false })
    const result = await session.toolkits()
    const items = result?.items || []
    if (!toolkit) {
      return Response.json({ ok: true, userId, items })
    }
    const match = items.find((t: any) => (t.slug || '').toLowerCase() === toolkit)
    if (!match) return Response.json({ ok: false, error: 'toolkit não encontrado para usuário', userId })
    const connected = Boolean(match?.connection?.connectedAccount?.id || match?.connection?.isActive)
    return Response.json({ ok: true, userId, toolkit: match.slug, connected, detail: match })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

