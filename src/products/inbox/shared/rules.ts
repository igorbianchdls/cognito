// Rules shared by the screens and the server.

export type ChannelKind = 'whatsapp' | 'instagram' | 'messenger' | 'teste'
export type MessageKind = 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'figurinha' | 'localizacao' | 'reacao' | 'outro'

export const CHANNEL_LABEL: Record<ChannelKind, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', messenger: 'Messenger', teste: 'Canal de teste' }

/** Meta lets a business answer freely for 24 h after the customer's last message; after that, only approved templates. */
export const WINDOW_MS = 24 * 3600 * 1000
export function windowOpen(kind: ChannelKind, lastInboundAt: string | Date | null | undefined, now = Date.now()) {
  if (kind === 'teste') return true
  if (!lastInboundAt) return false
  return now - new Date(lastInboundAt).getTime() < WINDOW_MS
}
/** Time left in the window, e.g. "3 h" or "12 min"; null when closed. */
export function windowLeft(kind: ChannelKind, lastInboundAt: string | null | undefined, now = Date.now()) {
  if (kind === 'teste' || !windowOpen(kind, lastInboundAt, now)) return null
  const ms = WINDOW_MS - (now - new Date(lastInboundAt!).getTime())
  return ms >= 3600000 ? `${Math.floor(ms / 3600000)} h` : `${Math.max(1, Math.floor(ms / 60000))} min`
}

const LABEL: Record<MessageKind, string> = { texto: '', imagem: '📷 Imagem', audio: '🎤 Áudio', video: '🎬 Vídeo', documento: '📄 Documento', figurinha: 'Figurinha', localizacao: '📍 Localização', reacao: 'Reação', outro: 'Mensagem' }
/** One line for the conversation list. */
export function previewOf(kind: MessageKind, body: string | null | undefined) {
  const text = (body ?? '').replace(/\s+/g, ' ').trim()
  if (kind === 'texto') return text.slice(0, 140)
  return (text ? `${LABEL[kind]}: ${text}` : LABEL[kind]).slice(0, 140)
}

export const MAX_TEXT = 4096
