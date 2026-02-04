import { NextRequest } from 'next/server'
import { Composio } from '@composio/core'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

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

async function resolveComposioUserId(req: NextRequest): Promise<string | null> {
  try {
    const cookies = parseCookies(req)
    const cookieUid = (cookies['composio_uid'] || '').trim()
    if (cookieUid) return cookieUid
  } catch {}
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id?.toString().trim()
    if (!uid) return null
    // Try shared.users.composio_user_id via RPC to Postgres if available
    const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL || '', { cache: 'no-store' }).catch(() => null)
    void res
    // Prefer direct query via dedicated API in your app; here we assume RLS allows select
    // Since we don't import runQuery here to keep route isolated, we rely on cookie when possible
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.COMPOSIO_API_KEY || ''
  if (!apiKey) return Response.json({ success: false, error: 'COMPOSIO_API_KEY ausente' }, { status: 400 })

  let body: any = {}
  try { body = await req.json() } catch {}

  const user_id = (body?.user_id || 'me').toString()
  const max_results_raw = Number(body?.max_results)
  const max_results = Number.isFinite(max_results_raw) ? Math.max(1, Math.min(100, Math.trunc(max_results_raw))) : 5
  const include_payload = Boolean(body?.include_payload)
  const include_spam_trash = Boolean(body?.include_spam_trash)
  const verbose = Boolean(body?.verbose)
  const page_token = typeof body?.page_token === 'string' ? body.page_token : undefined
  const q = typeof body?.q === 'string' ? body.q : undefined
  const labelIds = Array.isArray(body?.labelIds) ? body.labelIds : undefined

  let composioUserId = await resolveComposioUserId(req)
  // Allow override via header for testing
  if (!composioUserId) {
    const hdr = (req.headers.get('x-composio-user-id') || '').trim()
    if (hdr) composioUserId = hdr
  }
  if (!composioUserId) return Response.json({ success: false, error: 'composio_user_id ausente (cookie composio_uid não definido e sem fallback)' }, { status: 400 })

  try {
    const composio = new Composio({ apiKey })
    const session = await composio.create(String(composioUserId), {
      toolkits: ['gmail'],
      tools: { gmail: ['GMAIL_FETCH_EMAILS'] },
      tags: ['readOnlyHint'],
    } as any)

    // Try to execute the Gmail fetch tool directly.
    // Note: The Composio SDK provides tool invocation; here we call a generic run/execute method.
    const args: Record<string, any> = {
      user_id,
      max_results,
      include_payload,
      include_spam_trash,
      verbose,
    }
    if (typeof page_token === 'string' && page_token) args['page_token'] = page_token
    if (typeof q === 'string' && q) args['q'] = q
    if (Array.isArray(labelIds) && labelIds.length) args['labelIds'] = labelIds

    let result: any = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runner: any = (session as any)
      if (typeof runner.run === 'function') {
        result = await runner.run('GMAIL_FETCH_EMAILS', args)
      } else if (typeof runner.execute === 'function') {
        result = await runner.execute('GMAIL_FETCH_EMAILS', args)
      } else if (runner?.actions?.execute) {
        result = await runner.actions.execute('GMAIL_FETCH_EMAILS', args)
      } else {
        throw new Error('Método de execução da tool não disponível no SDK atual')
      }
    } catch (e) {
      // As fallback, return normalized shape with an error
      throw e
    }

    // Normalize output to expected shape for the UI renderer
    // If result already has data.results[0].response.data.messages, pass-through.
    const messages = result?.data?.results?.[0]?.response?.data?.messages
    const estimate = result?.data?.results?.[0]?.response?.data?.resultSizeEstimate
    const nextPageToken = result?.data?.results?.[0]?.response?.data?.nextPageToken
    if (Array.isArray(messages)) {
      return Response.json({ success: true, data: result?.data ?? result, count: typeof estimate === 'number' ? estimate : messages.length, nextPageToken })
    }
    // Otherwise, wrap raw messages if present
    if (Array.isArray(result?.messages)) {
      const wrap = {
        data: {
          results: [{ response: { successful: true, data: { messages: result.messages, resultSizeEstimate: result.messages.length, nextPageToken: result.nextPageToken } } }],
        },
      }
      return Response.json({ success: true, ...wrap, count: result.messages.length })
    }
    // Fallback: return raw
    return Response.json({ success: true, data: result })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}

