import type { NextRequest } from 'next/server'
import { getAgentMailClient } from '@/products/email/backend/integrations/agentmailClient'
import { parseBoolean, splitCsv } from '@/products/email/backend/shared/parsers'
import { toEmailErrorResponse } from '@/products/email/backend/shared/http'
import {
  parseComposePayload,
  parseLabelsPatchPayload,
  readRequiredTrimmedString,
} from '@/products/email/backend/features/messages/parsers/messagePayload'
import {
  getRequiredRouteId,
  readJsonObject,
} from '@/products/email/backend/features/messages/parsers/requestHelpers'
import type { RouteContextLike } from '@/products/email/backend/features/messages/types'

export async function listMessages(req: NextRequest) {
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

    const client = await getAgentMailClient()
    const opts: Record<string, unknown> = { limit, pageToken, labels, before, after, ascending, includeSpam }
    const data = await client.inboxes.messages.list(inboxId, opts)
    return Response.json({ ok: true, data })
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}

export async function sendMessage(req: NextRequest) {
  try {
    const body = await readJsonObject(req)
    const inboxId = readRequiredTrimmedString(body, 'inboxId')
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const payload = parseComposePayload(body)
    const { to, cc, bcc, labels, subject, text, html, attachments } = payload

    if (!to || to.length === 0) {
      return Response.json({ ok: false, error: 'Missing to' }, { status: 400 })
    }

    const client = await getAgentMailClient()
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
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}

export async function getMessage(req: NextRequest, context: RouteContextLike) {
  try {
    const id = await getRequiredRouteId(context)
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || undefined

    const client = await getAgentMailClient()
    let data: unknown
    try {
      data = await (client.messages?.get ? client.messages.get(id) : undefined)
    } catch {}

    if (!data && inboxId) {
      try {
        data = await client.inboxes?.messages?.get(inboxId, id)
      } catch {}
    }

    if (!data) {
      if (!inboxId) throw new Error('Message not found; provide inboxId for fallback lookup')
      const list = await client.inboxes?.messages?.list(inboxId)
      const listObj = list && typeof list === 'object' ? (list as Record<string, unknown>) : null
      const itemsCandidate = (listObj?.items ?? list) as unknown
      const items = Array.isArray(itemsCandidate) ? itemsCandidate : []
      data = items.find((m) => {
        if (!m || typeof m !== 'object') return false
        const msg = m as Record<string, unknown>
        return (msg.id || msg.messageId || msg.message_id) === id
      })
      if (!data) throw new Error('Message not found')
    }

    return Response.json({ ok: true, data })
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}

export async function runMessageAction(req: NextRequest, context: RouteContextLike) {
  try {
    const id = await getRequiredRouteId(context)
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const body = await readJsonObject(req)
    const action = readRequiredTrimmedString(body, 'action')
    const inboxId = readRequiredTrimmedString(body, 'inboxId')
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })
    if (!action) return Response.json({ ok: false, error: 'Missing action' }, { status: 400 })

    const client = await getAgentMailClient()

    if (action === 'reply' || action === 'replyAll') {
      const { to, cc, bcc, labels, text, html, attachments } = parseComposePayload(body)

      const sent =
        action === 'replyAll'
          ? await client.inboxes.messages.replyAll(inboxId, id, { to, cc, bcc, labels, text, html, attachments })
          : await client.inboxes.messages.reply(inboxId, id, { to, cc, bcc, labels, text, html, attachments })
      return Response.json({ ok: true, data: sent })
    }

    if (action === 'forward') {
      const { to, cc, bcc, labels, subject, text, html, attachments } = parseComposePayload(body)
      if (!to || to.length === 0) return Response.json({ ok: false, error: 'Missing to for forward' }, { status: 400 })

      const sent = await client.inboxes.messages.forward(inboxId, id, {
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
    }

    if (action === 'labels') {
      const { addLabels, removeLabels } = parseLabelsPatchPayload(body)
      if ((!addLabels || addLabels.length === 0) && (!removeLabels || removeLabels.length === 0)) {
        return Response.json({ ok: false, error: 'Provide addLabels and/or removeLabels' }, { status: 400 })
      }
      const updated = await client.inboxes.messages.update(inboxId, id, { addLabels, removeLabels })
      return Response.json({ ok: true, data: updated })
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}

export async function deleteMessage(req: NextRequest, context: RouteContextLike) {
  try {
    const id = await getRequiredRouteId(context)
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const mode = (searchParams.get('mode') || 'trash').trim().toLowerCase()
    const client = await getAgentMailClient()

    let data: unknown = null
    let strategy = ''
    let lastError: unknown = null

    if (mode === 'delete') {
      try {
        if (typeof client?.inboxes?.messages?.delete === 'function') {
          data = await client.inboxes.messages.delete(inboxId, id)
          strategy = 'inboxes.messages.delete'
        }
      } catch (error) {
        lastError = error
      }

      if (!data) {
        try {
          if (typeof client?.messages?.delete === 'function') {
            data = await client.messages.delete(id)
            strategy = 'messages.delete'
          }
        } catch (error) {
          lastError = error
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
        } catch (error) {
          lastError = error
        }
      }
    }

    if (!data) {
      const message = lastError instanceof Error
        ? lastError.message
        : 'Unable to delete/trash message with current SDK methods'
      return Response.json({ ok: false, error: message }, { status: 500 })
    }

    return Response.json({ ok: true, data, mode, strategy })
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}
