import { runQuery } from '@/lib/postgres'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

export async function resolveComposioUserIdFromRequest(req: Request): Promise<string | undefined> {
  let composioUserId: string | undefined

  try {
    const cookie = (req.headers.get('cookie') || '').toString()
    const m = cookie.match(/(?:^|;\s*)composio_uid=([^;]+)/)
    if (m && m[1]) composioUserId = decodeURIComponent(m[1])
  } catch {}

  if (composioUserId) return composioUserId

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id?.toString().trim()
    if (!uid) return undefined
    const rows = await runQuery<{ composio_user_id: string | null }>(
      'SELECT composio_user_id FROM shared.users WHERE id = $1',
      [uid]
    )
    const cid = (rows && rows[0] && rows[0].composio_user_id)
      ? String(rows[0].composio_user_id).trim()
      : ''
    if (cid) return cid
  } catch {}

  return undefined
}

