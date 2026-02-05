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

export async function GET(req: NextRequest, context: any) {
  try {
    const maybeParams = context?.params
    const params = (maybeParams && typeof maybeParams.then === 'function') ? await maybeParams : maybeParams
    const id = params?.id as string | undefined
    const attachmentId = params?.attachmentId as string | undefined
    if (!id) return Response.json({ ok: false, error: 'Missing message id' }, { status: 400 })
    if (!attachmentId) return Response.json({ ok: false, error: 'Missing attachment id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const client = await getClient()
    const data = await client.inboxes.messages.getAttachment(inboxId, id, attachmentId)
    if (!data?.downloadUrl) return Response.json({ ok: false, error: 'Attachment download URL not found' }, { status: 404 })

    return Response.redirect(data.downloadUrl, 302)
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
