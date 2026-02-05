import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CreateInboxInput = { domain?: string }
type SendInput = { inboxId: string; to: string; subject: string; text?: string; html?: string }

async function getAgentMailClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY
  if (!apiKey) throw new Error('AGENTMAIL_API_KEY not configured')
  // Load the SDK lazily to avoid build-time type issues if it's not present
  let AgentMailClient: any
  try {
    const mod: any = await import('agentmail')
    AgentMailClient = mod.AgentMailClient || mod.default || mod
  } catch (e) {
    // Fallback to require if dynamic import fails
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AgentMailClient = require('agentmail').AgentMailClient
  }
  return new AgentMailClient({ apiKey })
}

export async function GET() {
  return Response.json({ ok: true, ready: !!process.env.AGENTMAIL_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const action = String(body?.action || '').trim()
    if (!action) return Response.json({ ok: false, error: 'Missing action' }, { status: 400 })

    const client = await getAgentMailClient()

    if (action === 'createInbox') {
      const input: CreateInboxInput = { domain: body?.domain ? String(body.domain) : undefined }
      const inbox = await client.inboxes.create(input.domain)
      return Response.json({ ok: true, inbox, inboxId: inbox?.inboxId, address: inbox?.email, domain: inbox?.domain })
    }

    if (action === 'send') {
      const input: SendInput = {
        inboxId: String(body?.inboxId || ''),
        to: String(body?.to || ''),
        subject: String(body?.subject || ''),
        text: typeof body?.text === 'string' ? body.text : undefined,
        html: typeof body?.html === 'string' ? body.html : undefined,
      }
      if (!input.inboxId || !input.to || !input.subject) {
        return Response.json({ ok: false, error: 'Missing inboxId, to or subject' }, { status: 400 })
      }
      const res = await client.inboxes.messages.send(input.inboxId, {
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      })
      return Response.json({ ok: true, sent: res })
    }

    if (action === 'createAndSend') {
      const domain = body?.domain ? String(body.domain) : undefined
      const to = String(body?.to || '')
      const subject = String(body?.subject || '')
      const text = typeof body?.text === 'string' ? body.text : undefined
      const html = typeof body?.html === 'string' ? body.html : undefined
      if (!to || !subject) return Response.json({ ok: false, error: 'Missing to or subject' }, { status: 400 })

      const inbox = await client.inboxes.create(domain)
      const sent = await client.inboxes.messages.send(inbox.inboxId, { to, subject, text, html })
      return Response.json({ ok: true, inbox, sent })
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

