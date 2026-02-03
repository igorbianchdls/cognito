"use client"

import { useEffect, useRef, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"

type ChatMessage = { role: "user" | "assistant"; content: string }

export default function AutomacaoChatPage() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Sandbox não iniciada. Clique em Iniciar para começar." },
  ])
  const [events, setEvents] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const eventsEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  const appendEvent = (line: string) => setEvents(prev => [...prev.slice(-200), line])

  const handleStart = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-start' })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
      if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || `Erro ${res.status}`)
      setChatId(data.chatId)
      setMessages([{ role: 'assistant', content: 'Sandbox iniciada. Envie sua mensagem.' }])
      appendEvent('✅ Sandbox iniciada')
    } catch (e) {
      setError((e as Error).message)
      appendEvent(`❌ Erro ao iniciar: ${(e as Error).message}`)
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    if (!chatId) return
    setStarting(true)
    setError(null)
    try {
      await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-stop', chatId })
      })
      setChatId(null)
      setMessages(m => [...m, { role: 'assistant', content: 'Sandbox encerrada.' }])
      appendEvent('🛑 Sandbox encerrada')
    } catch (e) {
      setError((e as Error).message)
      appendEvent(`❌ Erro ao encerrar: ${(e as Error).message}`)
    } finally {
      setStarting(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !chatId) return
    setSending(true)
    setError(null)
    const base = [...messages, { role: 'user' as const, content: text }]
    const isSlash = text.startsWith('/')
    let assistantIndex = -1
    if (!isSlash) {
      setMessages([...base, { role: 'assistant', content: '' }])
      assistantIndex = base.length
    } else {
      setMessages(base)
    }
    setInput('')
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSlash ? { action: 'chat-slash', chatId, prompt: text } : { action: 'chat-send-stream', chatId, history: base })
      })
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erro ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const frames = buf.split('\n\n'); buf = frames.pop() || ''
        for (const f of frames) {
          const line = f.split('\n').find(l => l.startsWith('data: '))
          if (!line) continue
          const payload = line.slice(6)
          try {
            const evt = JSON.parse(payload) as { type?: string; text?: string; tool_name?: string; input?: any; output?: any; error?: string; name?: string; index?: number; partial?: string; agents?: string[]; subtype?: string }
            if (evt.type === 'delta' && typeof evt.text === 'string') {
              if (assistantIndex >= 0) {
                setMessages(prev => {
                  const copy = prev.slice()
                  const cur = copy[assistantIndex]
                  if (cur && cur.role === 'assistant') cur.content += evt.text
                  return copy
                })
              }
            } else if (evt.type === 'reasoning_start') {
              appendEvent('🧠 Início do raciocínio')
            } else if (evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
              // opcional: não exibir delta de raciocínio; só manter log curto
            } else if (evt.type === 'reasoning_end') {
              appendEvent('🧠 Fim do raciocínio')
            } else if (evt.type === 'tool_start') {
              appendEvent(`🛠️ Tool start: ${evt.tool_name || 'Tool'}`)
            } else if (evt.type === 'tool_done') {
              appendEvent(`✅ Tool done: ${evt.tool_name || 'Tool'}`)
            } else if (evt.type === 'tool_error') {
              appendEvent(`❌ Tool error: ${evt.tool_name || 'Tool'} — ${evt.error || ''}`)
            } else if (evt.type === 'subagent_start') {
              appendEvent(`🤖 Subagente iniciou: ${evt.name || ''}`)
            } else if (evt.type === 'subagent_stop') {
              appendEvent(`🤖 Subagente finalizou: ${evt.name || ''}`)
            } else if (evt.type === 'system' && evt.subtype) {
              appendEvent(`ℹ️ System: ${evt.subtype}`)
            }
          } catch { /* ignore non-JSON frames */ }
        }
      }
    } catch (e) {
      setError((e as Error).message)
      appendEvent(`❌ Erro no stream: ${(e as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Automação • Chat (Sandbox)</div>
              <div className="text-xs text-gray-500">Claude Agent SDK rodando dentro da Vercel Sandbox</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleStart} disabled={starting || !!chatId} className={`px-3 py-1.5 rounded text-white ${(!chatId && !starting) ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}>{starting? 'Aguarde…' : 'Iniciar'}</button>
              <button onClick={handleStop} disabled={starting || !chatId} className={`px-3 py-1.5 rounded text-white ${chatId ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'}`}>Parar</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full min-h-0">
            {/* Coluna esquerda: Chat */}
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[90%] rounded-lg px-3 py-2 ${m.role==='user'?'bg-blue-600 text-white ml-auto':'bg-gray-100 text-gray-900'}`}>{m.content}</div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 flex gap-2">
                <input
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  disabled={!chatId || sending}
                  placeholder={chatId ? 'Digite sua mensagem…' : 'Inicie o chat para enviar'}
                  className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleSend} disabled={!chatId || sending || !input.trim()} className={`px-4 py-2 rounded text-white ${(!chatId||sending)?'bg-gray-400':'bg-blue-600 hover:bg-blue-700'}`}>{sending? 'Enviando…':'Enviar'}</button>
              </div>
              {error && <div className="px-3 pb-2 text-sm text-red-600">{error}</div>}
            </div>
            {/* Coluna direita: Eventos do Sandbox */}
            <div className="h-full flex flex-col bg-white">
              <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">Eventos do Sandbox</div>
              <div className="flex-1 overflow-auto p-3 text-xs text-gray-800 space-y-1">
                {events.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">{l}</div>
                ))}
                <div ref={eventsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

