// Meta platform: reading webhooks (WhatsApp Cloud API, Instagram and Messenger) and calling the Graph API.
// Everything here is pure or takes `send` (fetch), so it runs in tests without the network.
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { ChannelKind, MessageKind } from '../shared/rules'

export const graphBase = () => (process.env.INBOX_META_GRAPH_URL || 'https://graph.facebook.com/v23.0').replace(/\/+$/, '')

export type MediaRef = { id?: string; url?: string; mime?: string; name?: string }
export type InboundMessage = {
  type: 'message'; channelKind: ChannelKind; channelId: string; contactId: string; contactName?: string; username?: string
  messageId: string; at: Date; direction: 'entrada' | 'saida'; kind: MessageKind; text: string | null; media?: MediaRef
}
export type StatusUpdate = { type: 'status'; channelKind: ChannelKind; channelId: string; messageId: string; status: 'enviada' | 'entregue' | 'lida' | 'falhou'; error?: string }
export type MetaEvent = InboundMessage | StatusUpdate

/** X-Hub-Signature-256 = "sha256=" + HMAC of the raw body with the app secret. */
export function validSignature(raw: string, header: string | null, appSecret: string) {
  if (!header?.startsWith('sha256=') || !appSecret) return false
  const expected = Buffer.from(createHmac('sha256', appSecret).update(raw, 'utf8').digest('hex'))
  const given = Buffer.from(header.slice(7))
  return given.length === expected.length && timingSafeEqual(given, expected)
}

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {})
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
const when = (seconds: unknown, ms?: unknown) => {
  const d = typeof ms === 'number' ? new Date(ms) : new Date(Number(seconds) * 1000)
  return isNaN(d.getTime()) ? new Date() : d
}

function whatsappMessage(m: Obj): { kind: MessageKind; text: string | null; media?: MediaRef } {
  const type = str(m.type)
  const part = obj(type ? m[type] : undefined)
  switch (type) {
    case 'text': return { kind: 'texto', text: str(part.body) ?? '' }
    case 'image': case 'video': case 'audio': case 'sticker': case 'document': {
      const kind = ({ image: 'imagem', video: 'video', audio: 'audio', sticker: 'figurinha', document: 'documento' } as const)[type]
      return { kind, text: str(part.caption) ?? null, media: { id: str(part.id), mime: str(part.mime_type), name: str(part.filename) } }
    }
    case 'location': {
      const place = [str(part.name), str(part.address)].filter(Boolean).join(' · ')
      return { kind: 'localizacao', text: [place, `${part.latitude},${part.longitude}`].filter(Boolean).join(' — ') }
    }
    case 'reaction': return { kind: 'reacao', text: str(part.emoji) ?? null }
    case 'button': return { kind: 'texto', text: str(part.text) ?? '' }
    case 'interactive': return { kind: 'texto', text: str(obj(part.button_reply).title) ?? str(obj(part.list_reply).title) ?? '' }
    default: return { kind: 'outro', text: 'Tipo de mensagem ainda não suportado pelo Inbox.' }
  }
}

function socialAttachment(a: Obj): { kind: MessageKind; media?: MediaRef; text?: string } {
  const url = str(obj(a.payload).url)
  switch (str(a.type)) {
    case 'image': return { kind: 'imagem', media: { url } }
    case 'video': case 'ig_reel': case 'reel': return { kind: 'video', media: { url } }
    case 'audio': return { kind: 'audio', media: { url } }
    case 'file': return { kind: 'documento', media: { url } }
    case 'location': return { kind: 'localizacao' }
    case 'story_mention': return { kind: 'outro', text: 'Mencionou você no story.', media: url ? { url } : undefined }
    case 'share': return { kind: 'outro', text: url ? `Compartilhou: ${url}` : 'Compartilhou uma publicação.' }
    default: return { kind: 'outro', text: 'Anexo ainda não suportado pelo Inbox.' }
  }
}

/** Normalized messages and delivery statuses from one webhook body. Unknown shapes are ignored, never thrown. */
export function parseWebhook(body: unknown): MetaEvent[] {
  const root = obj(body), events: MetaEvent[] = []
  if (root.object === 'whatsapp_business_account') {
    for (const entry of arr(root.entry)) for (const change of arr(obj(entry).changes)) {
      const value = obj(obj(change).value)
      const channelId = str(obj(value.metadata).phone_number_id)
      if (!channelId) continue
      const names = new Map(arr(value.contacts).map(c => [str(obj(c).wa_id), str(obj(obj(c).profile).name)]))
      for (const raw of arr(value.messages)) {
        const m = obj(raw), from = str(m.from), id = str(m.id)
        if (!from || !id) continue
        events.push({ type: 'message', channelKind: 'whatsapp', channelId, contactId: from, contactName: names.get(from), messageId: id, at: when(m.timestamp), direction: 'entrada', ...whatsappMessage(m) })
      }
      for (const raw of arr(value.statuses)) {
        const s = obj(raw), id = str(s.id)
        const status = ({ sent: 'enviada', delivered: 'entregue', read: 'lida', failed: 'falhou' } as const)[str(s.status) as 'sent']
        if (!id || !status) continue
        const error = arr(s.errors).map(e => str(obj(e).title) ?? str(obj(e).message)).filter(Boolean).join('; ') || undefined
        events.push({ type: 'status', channelKind: 'whatsapp', channelId, messageId: id, status, error })
      }
    }
  } else if (root.object === 'instagram' || root.object === 'page') {
    const channelKind: ChannelKind = root.object === 'instagram' ? 'instagram' : 'messenger'
    for (const rawEntry of arr(root.entry)) {
      const entry = obj(rawEntry), channelId = str(entry.id)
      if (!channelId) continue
      for (const raw of arr(entry.messaging)) {
        const e = obj(raw), sender = str(obj(e.sender).id), recipient = str(obj(e.recipient).id)
        const message = obj(e.message), postback = obj(e.postback)
        if (str(message.mid) && !message.is_deleted) {
          const echo = message.is_echo === true
          const contactId = echo ? recipient : sender
          if (!contactId) continue
          const first = arr(message.attachments).map(a => socialAttachment(obj(a)))[0]
          const text = str(message.text) ?? first?.text ?? null
          events.push({ type: 'message', channelKind, channelId, contactId, messageId: str(message.mid)!, at: when(undefined, e.timestamp),
            direction: echo ? 'saida' : 'entrada', kind: str(message.text) ? 'texto' : first?.kind ?? 'texto', text, media: first?.media })
        } else if (str(postback.mid) && sender) {
          events.push({ type: 'message', channelKind, channelId, contactId: sender, messageId: str(postback.mid)!, at: when(undefined, e.timestamp),
            direction: 'entrada', kind: 'texto', text: str(postback.title) ?? '' })
        }
      }
    }
  }
  return events
}

export class MetaError extends Error {
  constructor(message: string, public metaCode?: number) { super(message) }
  /** Expired or revoked token: the channel must be connected again. */
  get tokenInvalid() { return this.metaCode === 190 }
}

async function graph(send: typeof fetch, path: string, token: string, init: { method?: string; body?: object } = {}) {
  const response = await send(`${graphBase()}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined, signal: AbortSignal.timeout(15000),
  }).catch(() => null)
  if (!response) throw new MetaError('A Meta não respondeu. Tente de novo.')
  const body = obj(await response.json().catch(() => ({})))
  if (!response.ok) {
    const error = obj(body.error)
    throw new MetaError(str(error.error_user_msg) ?? str(error.message) ?? `A Meta recusou (HTTP ${response.status}).`, typeof error.code === 'number' ? error.code : undefined)
  }
  return body
}

/** Sends a text reply; returns the Meta message id. */
export async function sendText(send: typeof fetch, channel: { kind: ChannelKind; externalId: string }, token: string, to: string, text: string) {
  if (channel.kind === 'whatsapp') {
    const body = await graph(send, `/${channel.externalId}/messages`, token, { method: 'POST', body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: text, preview_url: true } } })
    const id = str(obj(arr(body.messages)[0]).id)
    if (!id) throw new MetaError('A Meta não devolveu o id da mensagem.')
    return id
  }
  const body = await graph(send, `/${channel.externalId}/messages`, token, { method: 'POST', body: { recipient: { id: to }, messaging_type: 'RESPONSE', message: { text } } })
  const id = str(body.message_id)
  if (!id) throw new MetaError('A Meta não devolveu o id da mensagem.')
  return id
}

/** The number behind a WhatsApp phone_number_id, checking the token at the same time. */
export async function whatsappNumber(send: typeof fetch, phoneNumberId: string, token: string) {
  const body = await graph(send, `/${phoneNumberId}?fields=display_phone_number,verified_name`, token)
  return { display: str(body.display_phone_number) ?? phoneNumberId, name: str(body.verified_name) }
}

/** Makes the WhatsApp Business Account send its webhooks to the app. */
export async function subscribeWhatsApp(send: typeof fetch, businessAccountId: string, token: string) {
  await graph(send, `/${businessAccountId}/subscribed_apps`, token, { method: 'POST' })
}

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024

/** Downloads an incoming file: WhatsApp gives a media id (two steps, with the token); Instagram/Messenger a URL. */
export async function downloadMedia(send: typeof fetch, media: MediaRef, token: string | null) {
  let url = media.url, mime = media.mime
  const headers: Record<string, string> = {}
  if (media.id && token) {
    const info = await graph(send, `/${media.id}`, token)
    url = str(info.url); mime = str(info.mime_type) ?? mime
    if (Number(info.file_size) > MAX_MEDIA_BYTES) throw new MetaError('Arquivo grande demais.')
    headers.Authorization = `Bearer ${token}`
  }
  if (!url || !/^https:\/\//.test(url)) throw new MetaError('Arquivo sem endereço.')
  const response = await send(url, { headers, signal: AbortSignal.timeout(20000) }).catch(() => null)
  if (!response?.ok) throw new MetaError('Não foi possível baixar o arquivo da Meta.')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > MAX_MEDIA_BYTES) throw new MetaError('Arquivo grande demais.')
  return { bytes, mime: mime ?? response.headers.get('content-type') ?? 'application/octet-stream' }
}
