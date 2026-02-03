import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

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

function setCookie(res: Response, name: string, value: string, maxAgeSeconds = 31536000) {
  res.headers.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`)
}

async function ensureSchema() {
  await runQuery(`CREATE SCHEMA IF NOT EXISTS composio`)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS composio.user_links (
      user_id text PRIMARY KEY,
      composio_user_id text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`)
}

export async function POST(req: NextRequest) {
  try {
    const { appUserId, composioUserId: providedComposioUserId } = await req.json().catch(() => ({})) as { appUserId?: string, composioUserId?: string }
    const appUser = (appUserId || '').trim()
    if (!appUser) return Response.json({ ok: false, error: 'appUserId obrigatório' }, { status: 400 })
    const cookies = parseCookies(req)
    const cookieUid = (cookies['composio_uid'] || '').trim()
    const composioUid = (providedComposioUserId || cookieUid).trim()
    if (!composioUid) return Response.json({ ok: false, error: 'composioUserId ausente (cookie composio_uid não definido)' }, { status: 400 })
    await ensureSchema()
    await runQuery(
      `INSERT INTO composio.user_links (user_id, composio_user_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET composio_user_id = EXCLUDED.composio_user_id, updated_at = now()`,
      [appUser, composioUid]
    )
    const res = Response.json({ ok: true, userId: appUser, composioUserId: composioUid })
    if (!cookieUid || cookieUid !== composioUid) setCookie(res, 'composio_uid', composioUid)
    return res
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams
    const appUserId = (search.get('appUserId') || '').trim()
    if (!appUserId) return Response.json({ ok: false, error: 'appUserId obrigatório' }, { status: 400 })
    await ensureSchema()
    const rows = await runQuery<{ user_id: string, composio_user_id: string }>(
      `SELECT user_id, composio_user_id FROM composio.user_links WHERE user_id = $1`,
      [appUserId]
    )
    if (!rows?.length) return Response.json({ ok: false, error: 'vínculo não encontrado' }, { status: 404 })
    const item = rows[0]
    const res = Response.json({ ok: true, userId: item.user_id, composioUserId: item.composio_user_id })
    const cookies = parseCookies(req)
    if (!cookies['composio_uid'] || cookies['composio_uid'] !== item.composio_user_id) {
      setCookie(res, 'composio_uid', item.composio_user_id)
    }
    return res
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

