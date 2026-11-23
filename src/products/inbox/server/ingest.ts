// What arrives from the Meta webhook (or the test channel) becomes contacts, conversations and messages.
// Runs with the service connection: the webhook has no person, the channel's external id says which company it is.
import { randomUUID } from 'node:crypto'
import { safeName } from '@/products/mcpcore/domains/editor/server/media'
import { previewOf, type ChannelKind } from '../shared/rules'
import type { Query } from './db'
import type { CommentEvent, InboundMessage, MetaEvent, StatusUpdate } from './meta'
import { onComment, onInbound } from './flows'
import { handleOptOutWord } from './broadcasts'

type Channel = { id: string; workspace_id: string; kind: ChannelKind }
export type StoredMedia = { path: string; mime: string; name: string | null }
export type IngestDeps = {
  service: Query
  /** Downloads and stores an attachment under the company folder; null when it can't (the message still goes in). */
  storeMedia?: (channel: Channel & { external_id: string }, message: InboundMessage, path: (name: string) => string) => Promise<StoredMedia | null>
  /** Automations run for each new customer message and comment (false turns them off, e.g. in tests). */
  automations?: false | { send?: typeof fetch }
}
export type IngestResult = { messages: number; statuses: number; ignored: number }

const ORDER = ['enviando', 'enviada', 'entregue', 'lida', 'falhou']

export async function ingest(events: MetaEvent[], deps: IngestDeps): Promise<IngestResult> {
  const result: IngestResult = { messages: 0, statuses: 0, ignored: 0 }
  const channels = new Map<string, (Channel & { external_id: string }) | null>()
  for (const event of events) {
    const key = `${event.channelKind}:${event.channelId}`
    if (!channels.has(key)) {
      const [row] = await deps.service<Channel & { external_id: string }>(
        `SELECT id, workspace_id, kind, external_id FROM inbox.channels WHERE kind = $1 AND external_id = $2 AND status <> 'desconectado'`, [event.channelKind, event.channelId])
      channels.set(key, row ?? null)
    }
    const channel = channels.get(key)
    if (!channel) { result.ignored++; continue }
    if (event.type === 'status') result.statuses += await applyStatus(deps.service, channel, event)
    else if (event.type === 'comment') { if (await addComment(deps, channel, event)) result.messages++; else result.ignored++ }
    else if (await addMessage(deps, channel, event)) result.messages++
    else result.ignored++
  }
  return result
}

async function applyStatus(service: Query, channel: Channel, s: StatusUpdate) {
  // Statuses only move forward (a late "delivered" never undoes "read"); failure can come after "sent".
  const rows = await service(`UPDATE inbox.messages m SET status = $3::inbox.message_status, error = coalesce($4, m.error)
    FROM inbox.conversations c WHERE c.id = m.conversation_id AND c.channel_id = $1 AND m.external_id = $2
      AND array_position($5::text[], m.status::text) < array_position($5::text[], $3) RETURNING m.id`, [channel.id, s.messageId, s.status, s.error ?? null, ORDER])
  return rows.length
}

async function contactFor(service: Query, channel: Channel, m: { contactId: string; contactName?: string; username?: string }) {
  const [known] = await service<{ contact_id: string; name: string }>(`SELECT i.contact_id, c.name FROM inbox.contact_identities i JOIN inbox.contacts c ON c.id = i.contact_id
    WHERE i.channel_id = $1 AND i.external_id = $2`, [channel.id, m.contactId])
  if (known) {
    if (m.contactName && known.name === 'Sem nome') await service('UPDATE inbox.contacts SET name = $2 WHERE id = $1', [known.contact_id, m.contactName.slice(0, 120)])
    return known.contact_id
  }
  // The same phone already in the company (typed in, or from another number) is the same person.
  const phone = channel.kind === 'whatsapp' && /^[0-9]{8,15}$/.test(m.contactId) ? '+' + m.contactId : null
  const byPhone = phone ? await service<{ id: string }>('SELECT id FROM inbox.contacts WHERE workspace_id = $1 AND phone = $2 ORDER BY created_at LIMIT 1', [channel.workspace_id, phone]) : []
  let contactId = byPhone[0]?.id
  if (!contactId) {
    const name = (m.contactName || (m.username ? '@' + m.username : null) || phone || 'Sem nome').slice(0, 120)
    const [created] = await service<{ id: string }>('INSERT INTO inbox.contacts (workspace_id, name, phone) VALUES ($1, $2, $3) RETURNING id', [channel.workspace_id, name, phone])
    contactId = created.id
  }
  const inserted = await service<{ contact_id: string }>(`INSERT INTO inbox.contact_identities (workspace_id, contact_id, channel_id, external_id, username) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (channel_id, external_id) DO NOTHING RETURNING contact_id`, [channel.workspace_id, contactId, channel.id, m.contactId, m.username ?? null])
  if (inserted[0]) return contactId!
  // Another delivery created it at the same time: use that one.
  const [winner] = await service<{ contact_id: string }>('SELECT contact_id FROM inbox.contact_identities WHERE channel_id = $1 AND external_id = $2', [channel.id, m.contactId])
  return winner.contact_id
}

async function addMessage(deps: IngestDeps, channel: Channel & { external_id: string }, m: InboundMessage) {
  const { service } = deps
  // Meta delivers at least once: the same message id is stored once (our own sends come back as echoes too).
  const [seen] = await service(`SELECT 1 FROM inbox.messages x JOIN inbox.conversations c ON c.id = x.conversation_id WHERE c.channel_id = $1 AND x.external_id = $2`, [channel.id, m.messageId])
  if (seen) return false
  const contactId = await contactFor(service, channel, m)
  const preview = previewOf(m.kind, m.text)
  const inbound = m.direction === 'entrada'
  const [conversation] = await service<{ id: string; created: boolean }>(`INSERT INTO inbox.conversations (workspace_id, channel_id, contact_id, last_message_at, last_inbound_at, last_preview, unread)
    VALUES ($1, $2, $3, $4, CASE WHEN $5 THEN $4::timestamptz END, $6, CASE WHEN $5 THEN 1 ELSE 0 END)
    ON CONFLICT (channel_id, contact_id) DO UPDATE SET
      last_message_at = greatest(inbox.conversations.last_message_at, excluded.last_message_at),
      last_inbound_at = CASE WHEN $5 THEN greatest(inbox.conversations.last_inbound_at, excluded.last_inbound_at) ELSE inbox.conversations.last_inbound_at END,
      last_preview = excluded.last_preview,
      unread = CASE WHEN $5 THEN inbox.conversations.unread + 1 ELSE inbox.conversations.unread END,
      status = CASE WHEN $5 AND inbox.conversations.status = 'fechada' THEN 'aberta' ELSE inbox.conversations.status END
    RETURNING id, (xmax = 0) AS created`, [channel.workspace_id, channel.id, contactId, m.at, inbound, preview])
  let stored: StoredMedia | null = null
  if (m.media && deps.storeMedia) {
    stored = await deps.storeMedia(channel, m, name => `${channel.workspace_id}/inbox/${randomUUID()}/${safeName(name)}`).catch(error => {
      console.error(JSON.stringify({ scope: 'inbox', code: 'MEDIA_FAILED', channel: channel.id, message: (error as Error).message }))
      return null
    })
  }
  const rows = await service(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, kind, body, media_path, media_mime, media_name, external_id, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING RETURNING id`,
  [channel.workspace_id, conversation.id, m.direction, m.kind, m.text, stored?.path ?? null, stored?.mime ?? m.media?.mime ?? null, stored?.name ?? m.media?.name ?? null,
    m.messageId, inbound ? 'recebida' : 'enviada', m.at])
  // SAIR / VOLTAR: broadcast opt-out, answered here and kept away from the automations.
  if (rows.length && inbound && m.text && deps.automations !== false && await handleOptOutWord({ service, send: deps.automations?.send },
    { workspaceId: channel.workspace_id, contactId, conversationId: conversation.id, channelKind: channel.kind, text: m.text }).catch(() => false)) return true
  if (rows.length && inbound && deps.automations !== false) {
    await onInbound({ service, send: deps.automations?.send }, { workspaceId: channel.workspace_id, channelId: channel.id, contactId, conversationId: conversation.id,
      text: m.text ?? '', isNew: conversation.created, ref: m.ref, story: m.story }).catch(error =>
      console.error(JSON.stringify({ scope: 'inbox', code: 'AUTOMATION_FAILED', message: (error as Error).message })))
  }
  return rows.length > 0
}

/**
 * A comment on a post: kept in the person's conversation (it does not open the 24-hour window) and handed to the
 * comment automations, which may answer in private.
 */
async function addComment(deps: IngestDeps, channel: Channel & { external_id: string }, c: CommentEvent) {
  const { service } = deps
  const [seen] = await service(`SELECT 1 FROM inbox.messages x JOIN inbox.conversations k ON k.id = x.conversation_id WHERE k.channel_id = $1 AND x.external_id = $2`, [channel.id, 'comment.' + c.commentId])
  if (seen) return false
  const contactId = await contactFor(service, channel, { contactId: c.contactId, username: c.username })
  const preview = previewOf('outro', `Comentou: ${c.text}`)
  const [conversation] = await service<{ id: string }>(`INSERT INTO inbox.conversations (workspace_id, channel_id, contact_id, last_message_at, last_preview, unread)
    VALUES ($1, $2, $3, $4, $5, 1)
    ON CONFLICT (channel_id, contact_id) DO UPDATE SET last_message_at = greatest(inbox.conversations.last_message_at, excluded.last_message_at), last_preview = excluded.last_preview,
      unread = inbox.conversations.unread + 1 RETURNING id`, [channel.workspace_id, channel.id, contactId, c.at, preview])
  await service(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, kind, body, external_id, status, created_at)
    VALUES ($1, $2, 'entrada', 'outro', $3, $4, 'recebida', $5) ON CONFLICT DO NOTHING`, [channel.workspace_id, conversation.id, `Comentou no post: "${c.text.slice(0, 1000)}"`, 'comment.' + c.commentId, c.at])
  if (deps.automations !== false) {
    await onComment({ service, send: deps.automations?.send }, { workspaceId: channel.workspace_id, channelId: channel.id, channelKind: channel.kind, contactId,
      conversationId: conversation.id, commentId: c.commentId, postId: c.postId, text: c.text }).catch(error =>
      console.error(JSON.stringify({ scope: 'inbox', code: 'AUTOMATION_FAILED', message: (error as Error).message })))
  }
  return true
}
