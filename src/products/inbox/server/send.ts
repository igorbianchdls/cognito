// Sending a message in a conversation, for people (reply) and for automations and broadcasts (no person): the same
// checks (channel on, recipient known, 24-hour window), one row in messages, then Meta (or the test channel).
import { randomUUID } from 'node:crypto'
import { MAX_TEXT, previewOf, windowOpen, type ChannelKind } from '../shared/rules'
import { InboxError, type Query } from './db'
import { unseal } from './crypto'
import { MetaError, sendMedia, sendMessage, type OutgoingMedia } from './meta'
import { signObject } from '@/products/mcpcore/domains/editor/server/media'

export type SendTarget = { id: string; workspace_id: string; contact_id: string; last_inbound_at: string | null; channel_id: string; kind: ChannelKind; external_id: string; channel_status: string; recipient: string | null }
export type Payload = { texto: string; botoes?: string[]; commentId?: string }
export type SendResult = { id: string; status: 'entregue' | 'enviada' | 'falhou'; erro?: string }

export const TARGET_SQL = `SELECT c.id, c.workspace_id, c.contact_id, c.last_inbound_at, ch.id AS channel_id, ch.kind, ch.external_id, ch.status AS channel_status, i.external_id AS recipient
  FROM inbox.conversations c JOIN inbox.channels ch ON ch.id = c.channel_id
  LEFT JOIN inbox.contact_identities i ON i.contact_id = c.contact_id AND i.channel_id = c.channel_id`

export async function loadTarget(service: Query, conversationId: string) {
  const [row] = await service<SendTarget>(`${TARGET_SQL} WHERE c.id = $1`, [conversationId])
  if (!row) throw new InboxError('NOT_FOUND', 'Conversa não encontrada.', 404)
  return row
}

/** Stores and sends. Throws InboxError for what can't be sent at all; a Meta failure comes back as status 'falhou'. */
export async function deliver(service: Query, target: SendTarget, payload: Payload, opts: { sentBy?: string | null; send?: typeof fetch } = {}): Promise<SendResult> {
  const text = payload.texto.trim()
  if (!text) throw new InboxError('EMPTY', 'Escreva a mensagem.')
  if (text.length > MAX_TEXT) throw new InboxError('TOO_LONG', `A mensagem passa de ${MAX_TEXT} caracteres.`)
  if (target.channel_status === 'desconectado') throw new InboxError('CHANNEL_OFF', 'Este canal foi desconectado. Conecte de novo em Canais.', 409)
  if (!target.recipient && !payload.commentId) throw new InboxError('NO_RECIPIENT', 'Este contato ainda não escreveu neste canal.', 409)
  // A private reply to a comment is allowed without a previous message (Meta gives 7 days for it).
  if (!payload.commentId && !windowOpen(target.kind, target.last_inbound_at)) {
    throw new InboxError('WINDOW_CLOSED', 'Passaram 24 horas desde a última mensagem do cliente. Pela regra da Meta, agora só dá para enviar um modelo aprovado (pelos Disparos).', 409)
  }
  const buttons = payload.botoes?.filter(b => b.trim()).slice(0, 10)
  const [message] = await service<{ id: string }>(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, kind, body, status, sent_by, buttons)
    VALUES ($1, $2, 'saida', 'texto', $3, 'enviando', $4, $5) RETURNING id`, [target.workspace_id, target.id, text, opts.sentBy ?? null, buttons?.length ? buttons : null])
  await service(`UPDATE inbox.conversations SET last_message_at = now(), last_preview = $2${opts.sentBy ? ', unread = 0' : ''} WHERE id = $1`, [target.id, previewOf('texto', text)])

  if (target.kind === 'teste') {
    await service(`UPDATE inbox.messages SET status = 'entregue', external_id = $2 WHERE id = $1`, [message.id, 'teste.' + randomUUID()])
    return { id: message.id, status: 'entregue' }
  }
  try {
    const [cred] = await service<{ token_sealed: string }>('SELECT token_sealed FROM inbox_private.channel_credentials WHERE channel_id = $1', [target.channel_id])
    if (!cred) throw new InboxError('NO_CREDENTIALS', 'Este canal está sem credencial. Conecte de novo em Canais.', 409)
    const externalId = await sendMessage(opts.send ?? fetch, { kind: target.kind, externalId: target.external_id }, unseal(cred.token_sealed),
      payload.commentId ? { commentId: payload.commentId } : { to: target.recipient! }, { text, buttons })
    // A status webhook can arrive before this update: never move the status backwards.
    await service(`UPDATE inbox.messages SET external_id = $2, status = CASE WHEN status = 'enviando' THEN 'enviada'::inbox.message_status ELSE status END WHERE id = $1`, [message.id, externalId])
    return { id: message.id, status: 'enviada' }
  } catch (error) {
    const reason = error instanceof MetaError || error instanceof InboxError ? error.message : 'Falha inesperada ao enviar.'
    await service(`UPDATE inbox.messages SET status = 'falhou', error = $2 WHERE id = $1`, [message.id, reason])
    if (error instanceof MetaError && error.tokenInvalid) {
      await service(`UPDATE inbox.channels SET status = 'erro', last_error = $2 WHERE id = $1`, [target.channel_id, 'A Meta recusou o token. Conecte o canal de novo.'])
    }
    if (!(error instanceof MetaError || error instanceof InboxError)) console.error(JSON.stringify({ scope: 'inbox', code: 'SEND_FAILED', message: (error as Error).message }))
    return { id: message.id, status: 'falhou', erro: reason }
  }
}

export type MediaPayload = { kind: OutgoingMedia['kind']; path: string; mime: string; name: string; caption?: string }
/** Sends a file already stored at `path` (drive bucket), with the same checks as text. */
export async function deliverMedia(service: Query, target: SendTarget, file: MediaPayload,
  opts: { sentBy?: string | null; send?: typeof fetch; sign?: (path: string) => Promise<string> } = {}): Promise<SendResult> {
  if (target.channel_status === 'desconectado') throw new InboxError('CHANNEL_OFF', 'Este canal foi desconectado. Conecte de novo em Canais.', 409)
  if (!target.recipient) throw new InboxError('NO_RECIPIENT', 'Este contato ainda não escreveu neste canal.', 409)
  if (!windowOpen(target.kind, target.last_inbound_at)) throw new InboxError('WINDOW_CLOSED', 'Passaram 24 horas desde a última mensagem do cliente. Pela regra da Meta, agora só dá para enviar um modelo aprovado (pelos Disparos).', 409)
  const caption = file.caption?.trim().slice(0, 1024) || null
  const [message] = await service<{ id: string }>(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, kind, body, media_path, media_mime, media_name, status, sent_by)
    VALUES ($1, $2, 'saida', $3, $4, $5, $6, $7, 'enviando', $8) RETURNING id`, [target.workspace_id, target.id, file.kind, caption, file.path, file.mime, file.name, opts.sentBy ?? null])
  await service(`UPDATE inbox.conversations SET last_message_at = now(), last_preview = $2${opts.sentBy ? ', unread = 0' : ''} WHERE id = $1`, [target.id, previewOf(file.kind, caption)])
  if (target.kind === 'teste') {
    await service(`UPDATE inbox.messages SET status = 'entregue', external_id = $2 WHERE id = $1`, [message.id, 'teste.' + randomUUID()])
    return { id: message.id, status: 'entregue' }
  }
  try {
    const [cred] = await service<{ token_sealed: string }>('SELECT token_sealed FROM inbox_private.channel_credentials WHERE channel_id = $1', [target.channel_id])
    if (!cred) throw new InboxError('NO_CREDENTIALS', 'Este canal está sem credencial. Conecte de novo em Canais.', 409)
    // Meta downloads the file from this link right away; one hour is plenty.
    const link = await (opts.sign ?? (p => signObject(p, 3600)))(file.path)
    const externalId = await sendMedia(opts.send ?? fetch, { kind: target.kind, externalId: target.external_id }, unseal(cred.token_sealed), target.recipient,
      { kind: file.kind, link, name: file.name, caption: caption ?? undefined })
    await service(`UPDATE inbox.messages SET external_id = $2, status = CASE WHEN status = 'enviando' THEN 'enviada'::inbox.message_status ELSE status END WHERE id = $1`, [message.id, externalId])
    return { id: message.id, status: 'enviada' }
  } catch (error) {
    const reason = error instanceof MetaError || error instanceof InboxError ? error.message : 'Falha inesperada ao enviar.'
    await service(`UPDATE inbox.messages SET status = 'falhou', error = $2 WHERE id = $1`, [message.id, reason])
    if (!(error instanceof MetaError || error instanceof InboxError)) console.error(JSON.stringify({ scope: 'inbox', code: 'SEND_MEDIA_FAILED', message: (error as Error).message }))
    return { id: message.id, status: 'falhou', erro: reason }
  }
}
