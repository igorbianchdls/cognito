import { atom } from 'nanostores'
import { createOutgoingMessage, formatWhatsappTime } from '@/products/whatsapp/frontend/services/chatActions'
import { SAMPLE_CHATS } from '@/products/whatsapp/shared/mockChats'
import type { WhatsappChat } from '@/products/whatsapp/shared/types'

const INITIAL_CHATS: WhatsappChat[] = SAMPLE_CHATS

export const $whatsappChats = atom<WhatsappChat[]>(INITIAL_CHATS)
export const $whatsappActiveChatId = atom<string>(INITIAL_CHATS[0]?.id || '')
export const $whatsappDraft = atom<string>('')

export const whatsappUiActions = {
  setActiveChat(chatId: string) {
    $whatsappActiveChatId.set(chatId)
  },
  setDraft(value: string) {
    $whatsappDraft.set(value)
  },
  sendDraft() {
    const text = $whatsappDraft.get().trim()
    const activeChatId = $whatsappActiveChatId.get()
    if (!text || !activeChatId) return false

    const outgoing = createOutgoingMessage(text)
    $whatsappChats.set(
      $whatsappChats.get().map((chat) =>
        chat.id === activeChatId
          ? { ...chat, last: text, time: formatWhatsappTime(), messages: [...chat.messages, outgoing] }
          : chat
      )
    )
    $whatsappDraft.set('')
    return true
  },
}
