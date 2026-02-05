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

function splitCsv(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length > 0 ? list : undefined
}

function parseAddressList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value.map((v) => String(v || '').trim()).filter(Boolean)
    return list.length > 0 ? list : undefined
  }
  if (typeof value === 'string') {
    return splitCsv(value)
  }
  return undefined
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value == null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const pageToken = searchParams.get('pageToken') || searchParams.get('cursor') || undefined
    const labels = splitCsv(searchParams.get('labels'))
    const before = searchParams.get('before') || undefined
    const after = searchParams.get('after') || undefined
    const ascending = parseBoolean(searchParams.get('ascending'))
    const includeSpam = parseBoolean(searchParams.get('includeSpam'))

    const client = await getClient()
    const opts: any = { limit, pageToken, labels, before, after, ascending, includeSpam }
    const data = await client.inboxes.messages.list(inboxId, opts)
    return Response.json({ ok: true, data })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const inboxId = String(body?.inboxId || '').trim()
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const to = parseAddressList(body?.to)
    const cc = parseAddressList(body?.cc)
    const bcc = parseAddressList(body?.bcc)
    const labels = Array.isArray(body?.labels) ? body.labels.map((s: any) => String(s).trim()).filter(Boolean) : parseAddressList(body?.labels)
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : undefined
    const text = typeof body?.text === 'string' ? body.text : undefined
    const html = typeof body?.html === 'string' ? body.html : undefined
    const attachments = Array.isArray(body?.attachments)
      ? body.attachments
          .map((att: any) => ({
            filename: typeof att?.filename === 'string' ? att.filename : undefined,
            contentType: typeof att?.contentType === 'string' ? att.contentType : undefined,
            contentDisposition: typeof att?.contentDisposition === 'string' ? att.contentDisposition : undefined,
            contentId: typeof att?.contentId === 'string' ? att.contentId : undefined,
            content: typeof att?.content === 'string' ? att.content : undefined,
            url: typeof att?.url === 'string' ? att.url : undefined,
          }))
          .filter((att: any) => !!att.content || !!att.url)
      : undefined

    if (!to || to.length === 0) {
      return Response.json({ ok: false, error: 'Missing to' }, { status: 400 })
    }

    const client = await getClient()
    const sent = await client.inboxes.messages.send(inboxId, {
      to,
      cc,
      bcc,
      labels,
      subject,
      text,
      html,
      attachments,
    })

    return Response.json({ ok: true, data: sent })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
