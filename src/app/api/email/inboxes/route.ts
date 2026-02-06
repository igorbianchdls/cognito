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
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const cursor = searchParams.get('cursor') || undefined
    const client = await getClient()
    // Try calling with pagination; fallback to simple list
    let data: any
    try {
      data = await client.inboxes.list({ limit, cursor })
    } catch {
      data = await client.inboxes.list()
    }
    return Response.json({ ok: true, data })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const inboxId = String(body?.inboxId || url.searchParams.get('inboxId') || '').trim()
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const client = await getClient()
    let data: any = null

    if (typeof client?.inboxes?.delete === 'function') {
      data = await client.inboxes.delete(inboxId)
    } else {
      throw new Error('Inbox delete is not available in current SDK client')
    }

    return Response.json({ ok: true, data: data ?? null })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
