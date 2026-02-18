import { randomUUID } from 'node:crypto'
import { runQuery, withTransaction } from '@/lib/postgres'

type InboxRow = {
  id: string
  username: string
  domain: string
  email: string
  display_name: string
  created_at: string
  updated_at: string
}

type MessageRow = {
  id: string
  inbox_id: string
  thread_id: string | null
  subject: string
  snippet: string
  text_body: string | null
  html_body: string | null
  from_name: string | null
  from_email: string | null
  to_recipients: unknown
  cc_recipients: unknown
  bcc_recipients: unknown
  labels: unknown
  attachments: unknown
  unread: boolean
  draft: boolean
  sent: boolean
  junk: boolean
  trashed: boolean
  archived: boolean
  created_at: string
  updated_at: string
}

type AddressLike = { name?: string; email?: string }

type SendPayload = {
  to?: unknown
  cc?: unknown
  bcc?: unknown
  labels?: unknown
  subject?: string
  text?: string
  html?: string
  attachments?: unknown
}

let ensureSchemaPromise: Promise<void> | null = null

function normalizeAddressList(value: unknown): AddressLike[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return null
        if (typeof item === 'string') {
          const email = item.trim()
          if (!email) return null
          return { email }
        }
        if (typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const email = String(obj.email || '').trim()
          const name = String(obj.name || '').trim()
          if (!email && !name) return null
          return { name: name || undefined, email: email || undefined }
        }
        return null
      })
      .filter(Boolean) as AddressLike[]
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((email) => ({ email }))
  }

  return []
}

function normalizeLabels(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map((v) => v.trim())
      : []

  return Array.from(new Set(raw.map((v) => String(v || '').trim()).filter(Boolean)))
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  if (value && typeof value === 'object') return [value]
  return []
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildSnippet(text: string | null | undefined, html: string | null | undefined, subject: string): string {
  const source = String(text || '').trim() || stripHtml(String(html || '').trim()) || subject
  return source.slice(0, 200)
}

function mapInbox(row: InboxRow) {
  return {
    id: row.id,
    inboxId: row.id,
    username: row.username,
    domain: row.domain,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMessage(row: MessageRow) {
  const toRecipients = parseJsonArray(row.to_recipients)
  const ccRecipients = parseJsonArray(row.cc_recipients)
  const bccRecipients = parseJsonArray(row.bcc_recipients)
  const labels = parseJsonArray(row.labels).map((v) => String(v || '').trim()).filter(Boolean)
  const attachmentsRaw = parseJsonArray(row.attachments)
  const attachments = attachmentsRaw.map((att, idx) => {
    const obj = att && typeof att === 'object' ? (att as Record<string, unknown>) : {}
    const fallbackId = `${row.id}-att-${idx + 1}`
    return {
      id: String(obj.id || fallbackId),
      attachmentId: String(obj.id || fallbackId),
      filename: String(obj.filename || `anexo-${idx + 1}`),
      contentType: obj.contentType ? String(obj.contentType) : undefined,
      contentDisposition: obj.contentDisposition ? String(obj.contentDisposition) : undefined,
      contentId: obj.contentId ? String(obj.contentId) : undefined,
      url: obj.url ? String(obj.url) : undefined,
      downloadUrl: obj.downloadUrl ? String(obj.downloadUrl) : undefined,
    }
  })

  const fromName = String(row.from_name || row.from_email || 'Remetente')
  const fromEmail = String(row.from_email || '')

  const flatTo = toRecipients
    .map((r) => (typeof r === 'string' ? r : String((r as Record<string, unknown>)?.email || (r as Record<string, unknown>)?.name || '').trim()))
    .filter(Boolean)

  const flatCc = ccRecipients
    .map((r) => (typeof r === 'string' ? r : String((r as Record<string, unknown>)?.email || (r as Record<string, unknown>)?.name || '').trim()))
    .filter(Boolean)

  const flatBcc = bccRecipients
    .map((r) => (typeof r === 'string' ? r : String((r as Record<string, unknown>)?.email || (r as Record<string, unknown>)?.name || '').trim()))
    .filter(Boolean)

  return {
    id: row.id,
    messageId: row.id,
    inboxId: row.inbox_id,
    threadId: row.thread_id,
    subject: row.subject,
    snippet: row.snippet,
    text: row.text_body || undefined,
    html: row.html_body || undefined,
    from: { name: fromName, email: fromEmail || undefined },
    from_name: fromName,
    from_email: fromEmail || undefined,
    to: flatTo,
    cc: flatCc,
    bcc: flatBcc,
    labels,
    attachments,
    unread: row.unread,
    isUnread: row.unread,
    draft: row.draft,
    isDraft: row.draft,
    sent: row.sent,
    isSent: row.sent,
    junk: row.junk,
    isJunk: row.junk,
    trashed: row.trashed,
    isTrashed: row.trashed,
    archived: row.archived,
    isArchived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    receivedAt: row.created_at,
  }
}

async function ensureSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await runQuery(`CREATE SCHEMA IF NOT EXISTS email`)
      await runQuery(
        `CREATE TABLE IF NOT EXISTS email.inboxes (
          id text PRIMARY KEY,
          username text NOT NULL,
          domain text NOT NULL DEFAULT 'aurorasemijoias.com.br',
          email text NOT NULL,
          display_name text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          archived_at timestamptz NULL
        )`
      )
      await runQuery(
        `CREATE TABLE IF NOT EXISTS email.messages (
          id text PRIMARY KEY,
          inbox_id text NOT NULL REFERENCES email.inboxes(id) ON DELETE CASCADE,
          thread_id text NULL,
          subject text NOT NULL,
          snippet text NOT NULL,
          text_body text NULL,
          html_body text NULL,
          from_name text NULL,
          from_email text NULL,
          to_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
          cc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
          bcc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
          labels jsonb NOT NULL DEFAULT '[]'::jsonb,
          attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
          unread boolean NOT NULL DEFAULT true,
          draft boolean NOT NULL DEFAULT false,
          sent boolean NOT NULL DEFAULT false,
          junk boolean NOT NULL DEFAULT false,
          trashed boolean NOT NULL DEFAULT false,
          archived boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          deleted_at timestamptz NULL
        )`
      )
      await runQuery(`CREATE INDEX IF NOT EXISTS idx_email_messages_inbox_created ON email.messages (inbox_id, created_at DESC)`)
    })()
  }

  await ensureSchemaPromise
}

async function findInbox(inboxId: string) {
  const rows = await runQuery<InboxRow>(
    `SELECT id, username, domain, email, display_name, created_at::text, updated_at::text
       FROM email.inboxes
      WHERE id = $1
        AND archived_at IS NULL
      LIMIT 1`,
    [inboxId]
  )
  return rows[0] || null
}

async function findMessage(id: string, inboxId?: string) {
  const rows = await runQuery<MessageRow>(
    `SELECT id, inbox_id, thread_id, subject, snippet, text_body, html_body, from_name, from_email,
            to_recipients, cc_recipients, bcc_recipients, labels, attachments,
            unread, draft, sent, junk, trashed, archived,
            created_at::text, updated_at::text
       FROM email.messages
      WHERE id = $1
        ${inboxId ? 'AND inbox_id = $2' : ''}
        AND deleted_at IS NULL
      LIMIT 1`,
    inboxId ? [id, inboxId] : [id]
  )
  return rows[0] || null
}

async function insertOutboundMessage(inboxId: string, inbox: InboxRow, payload: SendPayload, extra?: Partial<MessageRow>) {
  const id = `msg-${randomUUID()}`
  const subject = String(payload.subject || 'Sem assunto').trim() || 'Sem assunto'
  const text = typeof payload.text === 'string' ? payload.text : ''
  const html = typeof payload.html === 'string' ? payload.html : null

  const labels = normalizeLabels(payload.labels)
  if (!labels.includes('sent')) labels.push('sent')

  const toRecipients = normalizeAddressList(payload.to)
  const ccRecipients = normalizeAddressList(payload.cc)
  const bccRecipients = normalizeAddressList(payload.bcc)
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : []

  const snippet = buildSnippet(text, html, subject)

  await runQuery(
    `INSERT INTO email.messages
      (id, inbox_id, thread_id, subject, snippet, text_body, html_body, from_name, from_email,
       to_recipients, cc_recipients, bcc_recipients, labels, attachments,
       unread, draft, sent, junk, trashed, archived, created_at, updated_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17,$18,$19,$20,now(),now())`,
    [
      id,
      inboxId,
      extra?.thread_id || `thr-${randomUUID()}`,
      subject,
      snippet,
      text || null,
      html,
      inbox.display_name,
      inbox.email,
      JSON.stringify(toRecipients),
      JSON.stringify(ccRecipients),
      JSON.stringify(bccRecipients),
      JSON.stringify(labels),
      JSON.stringify(attachments),
      false,
      false,
      true,
      Boolean(extra?.junk),
      Boolean(extra?.trashed),
      Boolean(extra?.archived),
    ]
  )

  const created = await findMessage(id, inboxId)
  if (!created) throw new Error('Falha ao criar mensagem local')
  return mapMessage(created)
}

function parseCursor(value: unknown): number {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num < 0) return 0
  return num
}

export async function getLocalEmailClient() {
  await ensureSchema()

  return {
    inboxes: {
      list: async ({ limit, cursor }: { limit?: number; cursor?: unknown } = {}) => {
        const lim = Math.max(1, Math.min(200, Number(limit || 100)))
        const offset = parseCursor(cursor)
        const rows = await runQuery<InboxRow>(
          `SELECT id, username, domain, email, display_name, created_at::text, updated_at::text
             FROM email.inboxes
            WHERE archived_at IS NULL
            ORDER BY created_at ASC
            LIMIT $1 OFFSET $2`,
          [lim, offset]
        )
        const totalRows = await runQuery<{ total: number }>(
          `SELECT COUNT(*)::int AS total
             FROM email.inboxes
            WHERE archived_at IS NULL`
        )
        const total = Number(totalRows[0]?.total || 0)
        const nextOffset = offset + rows.length
        return {
          items: rows.map(mapInbox),
          cursor: rows.length > 0 && nextOffset < total ? String(nextOffset) : null,
          total,
        }
      },

      create: async (input: { username?: string; domain?: string; displayName?: string } = {}) => {
        const usernameRaw = String(input.username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
        const username = usernameRaw || `inbox-${Date.now().toString().slice(-6)}`
        const domain = String(input.domain || 'aurorasemijoias.com.br').trim().toLowerCase() || 'aurorasemijoias.com.br'
        const displayName = String(input.displayName || username).trim() || username
        const id = `ibx-${randomUUID()}`
        const email = `${username}@${domain}`

        await runQuery(
          `INSERT INTO email.inboxes (id, username, domain, email, display_name, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,now(),now())`,
          [id, username, domain, email, displayName]
        )

        const inbox = await findInbox(id)
        if (!inbox) throw new Error('Falha ao criar inbox local')
        return mapInbox(inbox)
      },

      delete: async (inboxId: string) => {
        const id = String(inboxId || '').trim()
        if (!id) throw new Error('Missing inbox id')

        await withTransaction(async (tx) => {
          await tx.query(
            `UPDATE email.inboxes
                SET archived_at = now(),
                    updated_at = now()
              WHERE id = $1`,
            [id]
          )

          await tx.query(
            `UPDATE email.messages
                SET deleted_at = now(),
                    updated_at = now()
              WHERE inbox_id = $1
                AND deleted_at IS NULL`,
            [id]
          )
        })

        return { id, deleted: true }
      },

      messages: {
        list: async (
          inboxId: string,
          opts: {
            limit?: number
            pageToken?: unknown
            labels?: string[]
            before?: string
            after?: string
            ascending?: boolean
            includeSpam?: boolean
          } = {}
        ) => {
          const id = String(inboxId || '').trim()
          if (!id) throw new Error('Missing inbox id')

          const lim = Math.max(1, Math.min(200, Number(opts.limit || 100)))
          const offset = parseCursor(opts.pageToken)
          const ascending = Boolean(opts.ascending)

          const where: string[] = ['inbox_id = $1', 'deleted_at IS NULL']
          const params: unknown[] = [id]
          let idx = 2

          if (!opts.includeSpam) {
            where.push('junk = false')
          }

          if (opts.before) {
            where.push(`created_at <= $${idx}`)
            params.push(opts.before)
            idx += 1
          }

          if (opts.after) {
            where.push(`created_at >= $${idx}`)
            params.push(opts.after)
            idx += 1
          }

          const rows = await runQuery<MessageRow>(
            `SELECT id, inbox_id, thread_id, subject, snippet, text_body, html_body, from_name, from_email,
                    to_recipients, cc_recipients, bcc_recipients, labels, attachments,
                    unread, draft, sent, junk, trashed, archived,
                    created_at::text, updated_at::text
               FROM email.messages
              WHERE ${where.join(' AND ')}
              ORDER BY created_at ${ascending ? 'ASC' : 'DESC'}
              LIMIT $${idx} OFFSET $${idx + 1}`,
            [...params, lim, offset]
          )

          const filtered = Array.isArray(opts.labels) && opts.labels.length > 0
            ? rows.filter((row) => {
                const labels = parseJsonArray(row.labels).map((v) => String(v || '').trim().toLowerCase())
                return opts.labels!.some((lbl) => labels.includes(String(lbl || '').trim().toLowerCase()))
              })
            : rows

          const items = filtered.map(mapMessage)
          const nextOffset = offset + rows.length
          return {
            items,
            cursor: rows.length >= lim ? String(nextOffset) : null,
          }
        },

        send: async (inboxId: string, payload: SendPayload = {}) => {
          const inbox = await findInbox(String(inboxId || '').trim())
          if (!inbox) throw new Error('Inbox not found')
          return insertOutboundMessage(inbox.id, inbox, payload)
        },

        get: async (inboxId: string, messageId: string) => {
          const row = await findMessage(String(messageId || '').trim(), String(inboxId || '').trim())
          if (!row) throw new Error('Message not found')
          return mapMessage(row)
        },

        reply: async (inboxId: string, messageId: string, payload: SendPayload = {}) => {
          const inbox = await findInbox(String(inboxId || '').trim())
          if (!inbox) throw new Error('Inbox not found')
          const original = await findMessage(String(messageId || '').trim(), inbox.id)
          if (!original) throw new Error('Message not found')

          const to = normalizeAddressList(payload.to)
          const fallbackTo = to.length > 0 ? to : [{
            name: original.from_name || undefined,
            email: original.from_email || undefined,
          }]

          return insertOutboundMessage(inbox.id, inbox, {
            ...payload,
            to: fallbackTo,
            subject: payload.subject || `Re: ${original.subject}`,
          }, {
            thread_id: original.thread_id || original.id,
          })
        },

        replyAll: async (inboxId: string, messageId: string, payload: SendPayload = {}) => {
          const inbox = await findInbox(String(inboxId || '').trim())
          if (!inbox) throw new Error('Inbox not found')
          const original = await findMessage(String(messageId || '').trim(), inbox.id)
          if (!original) throw new Error('Message not found')

          const originalTo = parseJsonArray(original.to_recipients)
          const to = normalizeAddressList(payload.to)
          const combined = to.length > 0 ? to : [
            ...originalTo,
            { name: original.from_name || undefined, email: original.from_email || undefined },
          ]

          return insertOutboundMessage(inbox.id, inbox, {
            ...payload,
            to: combined,
            subject: payload.subject || `Re: ${original.subject}`,
          }, {
            thread_id: original.thread_id || original.id,
          })
        },

        forward: async (inboxId: string, messageId: string, payload: SendPayload = {}) => {
          const inbox = await findInbox(String(inboxId || '').trim())
          if (!inbox) throw new Error('Inbox not found')
          const original = await findMessage(String(messageId || '').trim(), inbox.id)
          if (!original) throw new Error('Message not found')

          return insertOutboundMessage(inbox.id, inbox, {
            ...payload,
            subject: payload.subject || `Fwd: ${original.subject}`,
            text: payload.text || original.text_body || original.snippet,
          }, {
            thread_id: original.thread_id || original.id,
          })
        },

        update: async (
          inboxId: string,
          messageId: string,
          payload: { addLabels?: string[]; removeLabels?: string[] } = {}
        ) => {
          const row = await findMessage(String(messageId || '').trim(), String(inboxId || '').trim())
          if (!row) throw new Error('Message not found')

          const current = new Set(parseJsonArray(row.labels).map((v) => String(v || '').trim()).filter(Boolean))
          const add = normalizeLabels(payload.addLabels)
          const remove = normalizeLabels(payload.removeLabels)

          for (const label of add) current.add(label)
          for (const label of remove) current.delete(label)

          const labels = Array.from(current)

          await runQuery(
            `UPDATE email.messages
                SET labels = $1::jsonb,
                    updated_at = now()
              WHERE id = $2`,
            [JSON.stringify(labels), row.id]
          )

          const updated = await findMessage(row.id, row.inbox_id)
          if (!updated) throw new Error('Message not found')
          return mapMessage(updated)
        },

        delete: async (inboxId: string, messageId: string) => {
          const row = await findMessage(String(messageId || '').trim(), String(inboxId || '').trim())
          if (!row) throw new Error('Message not found')

          const labels = new Set(parseJsonArray(row.labels).map((v) => String(v || '').trim()).filter(Boolean))
          labels.add('trash')
          labels.delete('inbox')

          await runQuery(
            `UPDATE email.messages
                SET trashed = true,
                    unread = false,
                    labels = $1::jsonb,
                    updated_at = now()
              WHERE id = $2`,
            [JSON.stringify(Array.from(labels)), row.id]
          )

          const updated = await findMessage(row.id, row.inbox_id)
          if (!updated) throw new Error('Message not found')
          return mapMessage(updated)
        },

        getAttachment: async (inboxId: string, messageId: string, attachmentId: string) => {
          const row = await findMessage(String(messageId || '').trim(), String(inboxId || '').trim())
          if (!row) throw new Error('Message not found')

          const attachments = parseJsonArray(row.attachments)
          const target = attachments.find((att, idx) => {
            const obj = att && typeof att === 'object' ? (att as Record<string, unknown>) : {}
            const fallbackId = `${row.id}-att-${idx + 1}`
            const attId = String(obj.id || fallbackId)
            return attId === String(attachmentId || '').trim()
          })

          if (!target || typeof target !== 'object') {
            throw new Error('Attachment not found')
          }

          const obj = target as Record<string, unknown>
          const directUrl = String(obj.downloadUrl || obj.url || '').trim()
          if (directUrl) {
            return { downloadUrl: directUrl }
          }

          const rawContent = String(obj.content || '').trim()
          if (!rawContent) throw new Error('Attachment has no content')

          const contentType = String(obj.contentType || 'application/octet-stream').trim()
          const asDataUrl = rawContent.startsWith('data:')
            ? rawContent
            : `data:${contentType};base64,${rawContent}`

          return { downloadUrl: asDataUrl }
        },
      },
    },

    messages: {
      get: async (id: string) => {
        const row = await findMessage(String(id || '').trim())
        if (!row) throw new Error('Message not found')
        return mapMessage(row)
      },

      delete: async (id: string) => {
        const row = await findMessage(String(id || '').trim())
        if (!row) throw new Error('Message not found')

        return (await getLocalEmailClient()).inboxes.messages.delete(row.inbox_id, row.id)
      },
    },
  }
}
