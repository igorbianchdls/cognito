export type WhatsappMessage = {
  id: string
  from: 'me' | 'them'
  text?: string
  imageUrl?: string
  time: string
  status?: 'sent' | 'delivered' | 'read'
}

export type WhatsappChat = {
  id: string
  name: string
  last: string
  time: string
  unread?: number
  avatarHue?: number
  messages: WhatsappMessage[]
}
