import type { WhatsappMessage } from '@/products/whatsapp/shared/types'

export function formatWhatsappTime(date = new Date()) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function createOutgoingMessage(text: string): WhatsappMessage {
  return {
    id: `m${Math.random().toString(36).slice(2)}`,
    from: 'me',
    text,
    time: formatWhatsappTime(),
    status: 'sent',
  }
}
