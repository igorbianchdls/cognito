"use client"

import { useMemo, useRef, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Search, MoreVertical, Paperclip, Smile, Send, Check, CheckCheck, Phone, Video } from 'lucide-react'
import type { WhatsappMessage } from '@/products/whatsapp/shared/types'
import { $whatsappActiveChatId, $whatsappChats, $whatsappDraft, whatsappUiActions } from '@/products/whatsapp/state/whatsappUiStore'

export default function WhatsappPage() {
  const chats = useStore($whatsappChats)
  const activeId = useStore($whatsappActiveChatId)
  const draft = useStore($whatsappDraft)
  const active = useMemo(() => chats.find((c) => c.id === activeId) || chats[0] || null, [chats, activeId])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on chat change
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeId])

  const send = () => {
    const sent = whatsappUiActions.sendDraft()
    if (!sent) return
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: 'smooth' }), 10)
  }

  if (!active) {
    return (
      <SidebarProvider>
        <SidebarShadcn showHeaderTrigger={false} />
        <SidebarInset className="h-screen overflow-hidden">
          <div className="grid h-full place-items-center text-sm text-gray-500">Sem conversas.</div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left – Chats list */}
          <aside className="hidden h-full min-h-0 border-r border-gray-200 bg-white md:block">
            <div className="flex h-14 items-center gap-2 border-b px-3">
              <div className="text-base font-semibold">Chats</div>
              <div className="ml-auto relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input className="h-8 w-52 rounded-lg border border-gray-200 pl-8 pr-2 text-sm outline-none" placeholder="Pesquisar" />
              </div>
            </div>
            <div className="h-[calc(100%-56px)] overflow-auto">
              <ul>
                {chats.map(c => (
                  <li key={c.id}>
                    <button onClick={() => whatsappUiActions.setActiveChat(c.id)} className={`grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 ${activeId===c.id?'bg-gray-50':''}`}>
                      <div className="grid place-items-center">
                        <span className="inline-flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: `hsl(${c.avatarHue ?? 200} 70% 45%)` }}>
                          {c.name.split(' ').map(p=>p[0]).join('').slice(0,2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="shrink-0 text-[11px] text-gray-500">{c.time}</div>
                        </div>
                        <div className="truncate text-xs text-gray-600">{c.last}</div>
                      </div>
                      <div className="text-right">
                        {!!c.unread && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{c.unread}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right – Conversation */}
          <section className="flex h-full min-h-0 flex-col bg-[var(--wa-bg,#f0f2f5)]">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b bg-white px-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: `hsl(${active.avatarHue ?? 200} 70% 45%)` }}>{active.name.split(' ').map(p=>p[0]).join('').slice(0,2)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{active.name}</div>
                  <div className="text-xs text-gray-500">online agora</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <button title="Chamada de voz" className="rounded p-1 hover:bg-gray-100"><Phone className="size-4" /></button>
                <button title="Vídeo" className="rounded p-1 hover:bg-gray-100"><Video className="size-4" /></button>
                <button title="Mais" className="rounded p-1 hover:bg-gray-100"><MoreVertical className="size-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto bg-[#efeae2] px-2 py-3 sm:px-4 sm:py-4">
              <div className="w-full space-y-2">
                {active.messages.map(m => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </div>
            </div>

            {/* Composer */}
            <div className="flex items-center gap-2 border-t bg-white px-3 py-2">
              <button className="rounded p-2 text-gray-600 hover:bg-gray-100" title="Emoji"><Smile className="size-5" /></button>
              <button className="rounded p-2 text-gray-600 hover:bg-gray-100" title="Anexar"><Paperclip className="size-5" /></button>
              <input value={draft} onChange={(e)=> whatsappUiActions.setDraft(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }} placeholder="Digite uma mensagem" className="h-10 w-full rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-300" />
              <button onClick={send} className="rounded-full bg-emerald-600 p-2 text-white hover:bg-emerald-700" title="Enviar"><Send className="size-5" /></button>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function MessageBubble({ msg }: { msg: WhatsappMessage }) {
  const mine = msg.from === 'me'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-lg px-3 py-2 shadow ${mine ? 'rounded-tr-sm bg-emerald-100' : 'rounded-tl-sm bg-white'}`}>
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="imagem" className="mb-1 max-h-72 w-full rounded-md object-cover" />
        )}
        {msg.text && (
          <div className="whitespace-pre-wrap text-[15px] leading-snug text-gray-900">{msg.text}</div>
        )}
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
          <span>{msg.time}</span>
          {mine && (
            msg.status === 'read' ? <CheckCheck className="size-4 text-sky-500" /> : msg.status === 'delivered' ? <CheckCheck className="size-4" /> : <Check className="size-4" />
          )}
        </div>
      </div>
    </div>
  )
}
