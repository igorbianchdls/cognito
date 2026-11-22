// What a person does on the Inbox that goes through the server: reply, connect a channel, try the test channel.
// Each step checks access as the person (same rules as the screens) before using the service connection.
import { randomBytes, randomUUID } from 'node:crypto'
import { MAX_TEXT, type ChannelKind } from '../shared/rules'
import { requireWriter, InboxError, type Db, type Person } from './db'
import { seal } from './crypto'
import { ingest, type IngestDeps } from './ingest'
import { subscribeWhatsApp, whatsappNumber } from './meta'
import { deliver, TARGET_SQL, type SendTarget } from './send'

export type ActionDeps = { db: Db; send?: typeof fetch; storeMedia?: IngestDeps['storeMedia'] }

/** Sends a text reply in a conversation the person can write to. */
export async function reply(person: Person, conversationId: string, rawText: string, deps: ActionDeps) {
  const target = await deps.db.asPerson(person, async q => {
    const [row] = await q<SendTarget>(`${TARGET_SQL} WHERE c.id = $1 AND c.workspace_id = $2`, [conversationId, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Conversa não encontrada nesta empresa.', 404)
    await requireWriter(q, person.orgId)
    return row
  })
  return deliver(deps.db.service, target, { texto: rawText }, { sentBy: person.userId, send: deps.send })
}

const cleanName = (name: unknown, fallback: string) => (typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : fallback)

/** A simulated channel to try the Inbox without Meta, with a first conversation in it. */
export async function createTestChannel(person: Person, name: unknown, deps: ActionDeps) {
  await deps.db.asPerson(person, q => requireWriter(q, person.orgId))
  const externalId = 'teste-' + randomBytes(8).toString('hex')
  const [channel] = await deps.db.service<{ id: string }>(`INSERT INTO inbox.channels (workspace_id, kind, name, external_id, display, created_by)
    VALUES ($1, 'teste', $2, $3, 'Simulado', $4) RETURNING id`, [person.orgId, cleanName(name, 'Canal de teste'), externalId, person.userId])
  await ingest([{ type: 'message', channelKind: 'teste', channelId: externalId, contactId: 'cliente-exemplo', contactName: 'Cliente de exemplo', messageId: 'teste.' + randomUUID(),
    at: new Date(), direction: 'entrada', kind: 'texto', text: 'Olá! Vi o anúncio de vocês e queria saber mais sobre os produtos.' }], { service: deps.db.service })
  return channel
}

/** Writes in the test channel as if a customer had sent it. */
export async function simulateCustomer(person: Person, channelId: string, input: { nome?: unknown; texto?: unknown }, deps: ActionDeps) {
  const text = typeof input.texto === 'string' ? input.texto.trim().slice(0, MAX_TEXT) : ''
  if (!text) throw new InboxError('EMPTY', 'Escreva a mensagem do cliente.')
  const name = cleanName(input.nome, 'Cliente de exemplo')
  const channel = await deps.db.asPerson(person, async q => {
    const [row] = await q<{ external_id: string; kind: ChannelKind; status: string }>('SELECT external_id, kind, status FROM inbox.channels WHERE id = $1 AND workspace_id = $2', [channelId, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Canal não encontrado nesta empresa.', 404)
    if (row.kind !== 'teste') throw new InboxError('NOT_TEST', 'Só o canal de teste aceita mensagens simuladas.', 409)
    if (row.status === 'desconectado') throw new InboxError('CHANNEL_OFF', 'Este canal de teste está desconectado. Reconecte em Canais.', 409)
    await requireWriter(q, person.orgId)
    return row
  })
  const contactId = 'cliente-' + name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  await ingest([{ type: 'message', channelKind: 'teste', channelId: channel.external_id, contactId, contactName: name, messageId: 'teste.' + randomUUID(),
    at: new Date(), direction: 'entrada', kind: 'texto', text }], { service: deps.db.service })
}

/**
 * Connects a WhatsApp number with the ids and token from the Meta app (while the embedded sign-up isn't available).
 * Checks the token with Meta, subscribes the account to the webhooks and keeps the token sealed.
 */
export async function connectWhatsApp(person: Person, input: { nome?: unknown; phoneNumberId?: unknown; businessAccountId?: unknown; token?: unknown }, deps: ActionDeps) {
  const phoneNumberId = String(input.phoneNumberId ?? '').trim(), businessAccountId = String(input.businessAccountId ?? '').trim(), token = String(input.token ?? '').trim()
  if (!/^[0-9]{5,30}$/.test(phoneNumberId)) throw new InboxError('INVALID', 'Informe o ID do número de telefone (só números), do painel do WhatsApp na Meta.')
  if (!/^[0-9]{5,30}$/.test(businessAccountId)) throw new InboxError('INVALID', 'Informe o ID da conta do WhatsApp Business (só números).')
  if (token.length < 20 || /\s/.test(token)) throw new InboxError('INVALID', 'Token inválido.')
  await deps.db.asPerson(person, q => requireWriter(q, person.orgId))
  const send = deps.send ?? fetch
  const sealed = seal(token) // before calling Meta: without the key configured, nothing is saved
  let number: { display: string; name?: string }
  try {
    number = await whatsappNumber(send, phoneNumberId, token)
  } catch (error) {
    throw new InboxError('META_REFUSED', `A Meta não aceitou esses dados: ${(error as Error).message}`, 400)
  }
  let warning: string | null = null
  await subscribeWhatsApp(send, businessAccountId, token).catch(error => { warning = `Conectado, mas a Meta não ativou o recebimento de mensagens: ${(error as Error).message}` })
  // Reconnecting the company's own number refreshes it; a number of another company is never touched.
  const [channel] = await deps.db.service<{ id: string }>(`INSERT INTO inbox.channels (workspace_id, kind, name, external_id, display, created_by)
    VALUES ($1, 'whatsapp', $2, $3, $4, $5)
    ON CONFLICT (kind, external_id) DO UPDATE SET status = 'conectado', last_error = NULL, display = excluded.display
      WHERE inbox.channels.workspace_id = excluded.workspace_id
    RETURNING id`, [person.orgId, cleanName(input.nome, number.name ?? 'WhatsApp'), phoneNumberId, number.display, person.userId])
  if (!channel) throw new InboxError('TAKEN', 'Este número já está conectado a outra empresa no Otto.', 409)
  await deps.db.service(`INSERT INTO inbox_private.channel_credentials (channel_id, token_sealed, business_account_id) VALUES ($1, $2, $3)
    ON CONFLICT (channel_id) DO UPDATE SET token_sealed = excluded.token_sealed, business_account_id = excluded.business_account_id, updated_at = now()`, [channel.id, sealed, businessAccountId])
  return { id: channel.id, numero: number.display, aviso: warning }
}

/** Short link to a message attachment the person can see. */
export async function mediaPath(person: Person, messageId: string, db: Db) {
  return db.asPerson(person, async q => {
    const [row] = await q<{ media_path: string | null; media_name: string | null }>('SELECT media_path, media_name FROM inbox.messages WHERE id = $1 AND workspace_id = $2', [messageId, person.orgId])
    if (!row?.media_path) throw new InboxError('NOT_FOUND', 'Arquivo não encontrado.', 404)
    return row
  })
}

export type RemoveMedia = (paths: string[]) => Promise<void>

/** Stops a channel without losing its history: no more sending or receiving, the token is forgotten. */
export async function setChannelState(person: Person, channelId: string, action: 'desconectar' | 'reconectar', deps: ActionDeps) {
  const channel = await deps.db.asPerson(person, async q => {
    const [row] = await q<{ id: string; kind: ChannelKind }>('SELECT id, kind FROM inbox.channels WHERE id = $1 AND workspace_id = $2', [channelId, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Canal não encontrado nesta empresa.', 404)
    await requireWriter(q, person.orgId)
    return row
  })
  if (action === 'reconectar') {
    if (channel.kind !== 'teste') throw new InboxError('RECONNECT', 'Para reconectar, conecte o número de novo com o token da Meta.', 409)
    await deps.db.service(`UPDATE inbox.channels SET status = 'conectado', last_error = NULL WHERE id = $1`, [channelId])
    return { status: 'conectado' as const }
  }
  await deps.db.service(`UPDATE inbox.channels SET status = 'desconectado', last_error = NULL WHERE id = $1`, [channelId])
  await deps.db.service('DELETE FROM inbox_private.channel_credentials WHERE channel_id = $1', [channelId])
  return { status: 'desconectado' as const }
}

async function removeFiles(paths: string[], orgId: string, remove: RemoveMedia | undefined) {
  const mine = paths.filter(p => p.startsWith(orgId + '/inbox/'))
  if (!mine.length || !remove) return 0
  // The rows are already gone; a storage failure only leaves files behind, so it is logged, not thrown.
  await remove(mine).catch(error => console.error(JSON.stringify({ scope: 'inbox', code: 'MEDIA_CLEANUP_FAILED', files: mine.length, message: (error as Error).message })))
  return mine.length
}

/** Deletes a channel with its conversations and messages, and the files received through it. */
export async function deleteChannel(person: Person, channelId: string, deps: ActionDeps & { removeMedia?: RemoveMedia }) {
  await deps.db.asPerson(person, async q => {
    const [row] = await q('SELECT id FROM inbox.channels WHERE id = $1 AND workspace_id = $2', [channelId, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Canal não encontrado nesta empresa.', 404)
    await requireWriter(q, person.orgId)
  })
  const files = await deps.db.service<{ media_path: string }>(`SELECT m.media_path FROM inbox.messages m JOIN inbox.conversations c ON c.id = m.conversation_id
    WHERE c.channel_id = $1 AND m.media_path IS NOT NULL`, [channelId])
  await deps.db.service('DELETE FROM inbox.channels WHERE id = $1 AND workspace_id = $2', [channelId, person.orgId])
  return { arquivos_apagados: await removeFiles(files.map(f => f.media_path), person.orgId, deps.removeMedia) }
}

/** Deletes a contact with all their conversations, notes and the files they sent (LGPD: nothing of theirs is left). */
export async function deleteContact(person: Person, contactId: string, deps: ActionDeps & { removeMedia?: RemoveMedia }) {
  await deps.db.asPerson(person, async q => {
    const [row] = await q('SELECT id FROM inbox.contacts WHERE id = $1 AND workspace_id = $2', [contactId, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Contato não encontrado nesta empresa.', 404)
    await requireWriter(q, person.orgId)
  })
  const files = await deps.db.service<{ media_path: string }>(`SELECT m.media_path FROM inbox.messages m JOIN inbox.conversations c ON c.id = m.conversation_id
    WHERE c.contact_id = $1 AND m.media_path IS NOT NULL`, [contactId])
  await deps.db.service('DELETE FROM inbox.contacts WHERE id = $1 AND workspace_id = $2', [contactId, person.orgId])
  return { arquivos_apagados: await removeFiles(files.map(f => f.media_path), person.orgId, deps.removeMedia) }
}
