import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY
  if (!apiKey) throw new Error('AGENTMAIL_API_KEY not configured')
  let AgentMailClient: any
  try {
    const mod: any = await import('agentmail')
    AgentMailClient = mod.AgentMailClient || mod.default || mod
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AgentMailClient = require('agentmail').AgentMailClient
  }
  return new AgentMailClient({ apiKey })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const cursor = searchParams.get('cursor') || undefined
    const q = searchParams.get('q') || undefined
    const labels = searchParams.get('labels') || undefined
    const starred = searchParams.get('starred') ? searchParams.get('starred') === 'true' : undefined
    const unread = searchParams.get('unread') ? searchParams.get('unread') === 'true' : undefined

    const client = await getClient()
    let data: any
    const opts: any = { limit, cursor, q, labels, starred, unread }
    try {
      data = await client.inboxes.messages.list(inboxId, opts)
    } catch {
      // Fallback if SDK signature differs
      data = await client.inboxes.messages.list(inboxId)
    }
    return Response.json({ ok: true, data })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

