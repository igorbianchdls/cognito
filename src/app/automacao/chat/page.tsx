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

  // Automação (agendamento local)
  const [autoPrompt, setAutoPrompt] = useState<string>("Escreva um parágrafo introdutório sobre nossa empresa.")
  const [autoDelaySec, setAutoDelaySec] = useState<number>(10)
  const [scheduledAt, setScheduledAt] = useState<number | null>(null)
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const scheduleTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  const appendEvent = (line: string) => setEvents(prev => [...prev.slice(-200), line])

  // Garante que a sandbox está iniciada e retorna o chatId
  const ensureStart = async (): Promise<string> => {
    if (chatId) return chatId
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
    return data.chatId
  }

  const handleStart = async () => {
    setStarting(true)
    setError(null)
    try { await ensureStart() } catch (e) { setError((e as Error).message); appendEvent(`❌ Erro ao iniciar: ${(e as Error).message}`) } finally { setStarting(false) }
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

  // Função utilitária para enviar texto arbitrário
  const sendText = async (text: string) => {
    if (!text) return
    const id = chatId || await ensureStart()
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
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSlash ? { action: 'chat-slash', chatId: id, prompt: text } : { action: 'chat-send-stream', chatId: id, history: base })
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

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendText(text)
  }

  // Automação (agendar)
  const scheduleRun = async () => {
    try {
      const id = await ensureStart()
      if (!id) throw new Error('Falha ao iniciar sandbox')
      const delay = Math.max(1, Number(autoDelaySec) || 1)
      const fireAt = Date.now() + delay * 1000
      setScheduledAt(fireAt)
      setCountdownMs(fireAt - Date.now())
      if (scheduleTimerRef.current) { window.clearTimeout(scheduleTimerRef.current) }
      scheduleTimerRef.current = window.setTimeout(async () => {
        appendEvent(`⏱️ Disparando automação (delay ${delay}s)`)
        await sendText(autoPrompt)
        setScheduledAt(null)
        if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current) }
        countdownTimerRef.current = null
      }, delay * 1000) as unknown as number
      // Atualiza countdown a cada 200ms
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = window.setInterval(() => {
        setCountdownMs(Math.max(0, fireAt - Date.now()))
      }, 200) as unknown as number
      appendEvent(`🕒 Automação agendada para ${new Date(fireAt).toLocaleTimeString()}`)
    } catch (e) {
      setError((e as Error).message)
      appendEvent(`❌ Falha ao agendar: ${(e as Error).message}`)
    }
  }

  const cancelSchedule = () => {
    if (scheduleTimerRef.current) window.clearTimeout(scheduleTimerRef.current)
    scheduleTimerRef.current = null
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    countdownTimerRef.current = null
    setScheduledAt(null)
    setCountdownMs(0)
    appendEvent('⛔ Agendamento cancelado')
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full min-h-0">
            {/* Coluna esquerda: Automação */}
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">Automação</div>
              <div className="p-3 space-y-3 overflow-auto">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prompt</label>
                  <textarea value={autoPrompt} onChange={e=>setAutoPrompt(e.target.value)} className="w-full h-28 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Atraso (segundos)</label>
                  <input type="number" min={1} value={autoDelaySec} onChange={e=>setAutoDelaySec(Math.max(1, Number(e.target.value)||10))} className="w-32 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={scheduleRun} disabled={sending || starting} className="px-3 py-1.5 rounded text-white bg-emerald-600 hover:bg-emerald-700">Agendar</button>
                  <button onClick={async ()=>{ await sendText(autoPrompt) }} disabled={sending || starting} className="px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700">Executar agora</button>
                  <button onClick={cancelSchedule} disabled={!scheduledAt} className={`px-3 py-1.5 rounded text-white ${scheduledAt? 'bg-orange-600 hover:bg-orange-700':'bg-gray-400'}`}>Cancelar</button>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Status: {chatId ? 'Sandbox ativa' : 'Sandbox inativa'}</div>
                  <div>
                    Próxima execução: {scheduledAt ? new Date(scheduledAt).toLocaleTimeString() : '—'} {scheduledAt ? ` (em ${(Math.ceil(countdownMs/1000))}s)` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna central: Chat */}
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
