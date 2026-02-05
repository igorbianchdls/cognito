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

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params?.id
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || undefined

    const client = await getClient()
    let data: any
    // Try common SDK signatures
    try {
      data = await (client.messages?.get ? client.messages.get(id) : undefined)
    } catch {}
    if (!data && inboxId) {
      try { data = await client.inboxes?.messages?.get(inboxId, id) } catch {}
    }
    if (!data) {
      // Last resort: list messages in inbox and find by id
      if (!inboxId) throw new Error('Message not found; provide inboxId for fallback lookup')
      const list = await client.inboxes?.messages?.list(inboxId)
      const items = (list?.items || list || []) as any[]
      data = items.find((m: any) => (m.id || m.messageId || m.message_id) === id)
      if (!data) throw new Error('Message not found')
    }
    return Response.json({ ok: true, data })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

