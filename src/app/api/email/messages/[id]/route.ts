import type { NextRequest } from 'next/server'
import { getAgentMailClient } from '@/features/email/backend/integrations/agentmailClient'
import { parseAddressList } from '@/features/email/backend/shared/parsers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, context: any) {
  try {
    const maybeParams = context?.params
    const params = (maybeParams && typeof maybeParams.then === 'function') ? await maybeParams : maybeParams
    const id = params?.id as string | undefined
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })
    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || undefined

    const client = await getAgentMailClient()
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

export async function POST(req: NextRequest, context: any) {
  try {
    const maybeParams = context?.params
    const params = (maybeParams && typeof maybeParams.then === 'function') ? await maybeParams : maybeParams
    const id = params?.id as string | undefined
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()
    const inboxId = String(body?.inboxId || '').trim()
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })
    if (!action) return Response.json({ ok: false, error: 'Missing action' }, { status: 400 })

    const client = await getAgentMailClient()

    if (action === 'reply' || action === 'replyAll') {
      const to = parseAddressList(body?.to)
      const cc = parseAddressList(body?.cc)
      const bcc = parseAddressList(body?.bcc)
      const labels = Array.isArray(body?.labels) ? body.labels.map((s: any) => String(s).trim()).filter(Boolean) : parseAddressList(body?.labels)
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

      const sent = action === 'replyAll'
        ? await client.inboxes.messages.replyAll(inboxId, id, { to, cc, bcc, labels, text, html, attachments })
        : await client.inboxes.messages.reply(inboxId, id, { to, cc, bcc, labels, text, html, attachments })
      return Response.json({ ok: true, data: sent })
    }

    if (action === 'forward') {
      const to = parseAddressList(body?.to)
      if (!to || to.length === 0) return Response.json({ ok: false, error: 'Missing to for forward' }, { status: 400 })
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

      const sent = await client.inboxes.messages.forward(inboxId, id, { to, cc, bcc, labels, subject, text, html, attachments })
      return Response.json({ ok: true, data: sent })
    }

    if (action === 'labels') {
      const addLabels = Array.isArray(body?.addLabels) ? body.addLabels.map((s: any) => String(s).trim()).filter(Boolean) : undefined
      const removeLabels = Array.isArray(body?.removeLabels) ? body.removeLabels.map((s: any) => String(s).trim()).filter(Boolean) : undefined
      if ((!addLabels || addLabels.length === 0) && (!removeLabels || removeLabels.length === 0)) {
        return Response.json({ ok: false, error: 'Provide addLabels and/or removeLabels' }, { status: 400 })
      }
      const updated = await client.inboxes.messages.update(inboxId, id, { addLabels, removeLabels })
      return Response.json({ ok: true, data: updated })
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const maybeParams = context?.params
    const params = (maybeParams && typeof maybeParams.then === 'function') ? await maybeParams : maybeParams
    const id = params?.id as string | undefined
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })
    const mode = (searchParams.get('mode') || 'trash').trim().toLowerCase()

    const client = await getAgentMailClient()
    let data: any = null
    let strategy = ''
    let lastError: any = null

    if (mode === 'delete') {
      try {
        if (typeof client?.inboxes?.messages?.delete === 'function') {
          data = await client.inboxes.messages.delete(inboxId, id)
          strategy = 'inboxes.messages.delete'
        }
      } catch (e) {
        lastError = e
      }
      if (!data) {
        try {
          if (typeof client?.messages?.delete === 'function') {
            data = await client.messages.delete(id)
            strategy = 'messages.delete'
          }
        } catch (e) {
          lastError = e
        }
      }
    }

    if (!data) {
      const labelAttempts = [
        { addLabels: ['trash'], removeLabels: ['inbox'] },
        { addLabels: ['TRASH'], removeLabels: ['INBOX'] },
        { addLabels: ['\\Trash'], removeLabels: ['\\Inbox'] },
        { addLabels: ['trash'] },
        { addLabels: ['TRASH'] },
      ]
      for (const labels of labelAttempts) {
        try {
          if (typeof client?.inboxes?.messages?.update !== 'function') continue
          data = await client.inboxes.messages.update(inboxId, id, labels)
          strategy = 'inboxes.messages.update(labels)'
          break
        } catch (e) {
          lastError = e
        }
      }
    }

    if (!data) {
      const msg = lastError?.message || 'Unable to delete/trash message with current SDK methods'
      return Response.json({ ok: false, error: msg }, { status: 500 })
    }

    return Response.json({
      ok: true,
      data,
      mode,
      strategy,
    })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
