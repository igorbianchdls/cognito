'use client'

import { useState } from 'react'

type Msg = { role: 'user'|'assistant'; content: string }

export default function SandboxChatPage() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [history, setHistory] = useState<Msg[]>([])
  const [input, setInput] = useState('Olá!')
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-start' }) })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
      if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || `Erro ${res.status}`)
      setChatId(data.chatId)
      setHistory([])
    } catch (e) {
      setError((e as Error).message)
    } finally { setStarting(false) }
  }

  const stop = async () => {
    if (!chatId) return
    setStarting(true)
    setError(null)
    try {
      await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-stop', chatId }) })
      setChatId(null)
    } catch (e) { setError((e as Error).message) } finally { setStarting(false) }
  }

  const send = async () => {
    if (!chatId || !input.trim()) return
    setSending(true); setError(null)
    try {
      const next = [...history, { role: 'user' as const, content: input }]
      setHistory(next); setInput('')
      const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-send', chatId, history: next }) })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; reply?: string; error?: string }
      if (!res.ok || data.ok === false) throw new Error(data.error || `Erro ${res.status}`)
      setHistory(h => [...h, { role: 'assistant', content: data.reply || '' }])
    } catch (e) { setError((e as Error).message) } finally { setSending(false) }
  }

  const sendStream = async () => {
    if (!chatId || !input.trim()) return
    setStreaming(true); setError(null)
    try {
      const next = [...history, { role: 'user' as const, content: input }]
      setHistory(next); setInput('')
      const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-send-stream', chatId, history: next }) })
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => `Erro ${res.status}`))
      setHistory(h => [...h, { role: 'assistant', content: '' }])
      const idx = history.length + 1
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done } = await reader.read(); if (done) break
        buf += decoder.decode(value, { stream: true })
        const frames = buf.split('\n\n'); buf = frames.pop() || ''
        for (const f of frames) {
          const line = f.split('\n').find(l => l.startsWith('data: ')); if (!line) continue
          const payload = line.slice(6)
          try {
            const evt = JSON.parse(payload)
            if (evt.type === 'delta' && typeof evt.text === 'string') {
              setHistory(h => { const copy = h.slice(); const cur = copy[idx]; if (cur && cur.role==='assistant') cur.content += evt.text; return copy })
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) { setError((e as Error).message) } finally { setStreaming(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Sandbox Chat (Claude Agent SDK)</h1>
        <div className="flex gap-2">
          <button onClick={start} disabled={starting || !!chatId} className={`px-3 py-2 rounded-md text-white ${starting||chatId?'bg-gray-400':'bg-emerald-600 hover:bg-emerald-700'}`}>Iniciar chat</button>
          <button onClick={stop} disabled={starting || !chatId} className={`px-3 py-2 rounded-md text-white ${starting||!chatId?'bg-gray-400':'bg-rose-600 hover:bg-rose-700'}`}>Encerrar chat</button>
          {chatId && <span className="text-sm text-gray-500">chatId: {chatId.slice(0,8)}…</span>}
        </div>
        <div className="space-y-2 p-3 bg-white border border-gray-200 rounded">
          <div className="space-y-1 max-h-72 overflow-auto">
            {history.length===0 && <div className="text-sm text-gray-500">Sem mensagens.</div>}
            {history.map((m,i)=> (
              <div key={i} className={m.role==='user'?'text-gray-900':'text-blue-700'}>
                <span className="font-medium">{m.role==='user'?'Você':'Assistente'}: </span>
                <span>{m.content}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} disabled={!chatId} className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite…" />
            <button onClick={send} disabled={!chatId||sending||streaming||!input.trim()} className={`px-3 py-2 rounded-md text-white ${(!chatId||sending||streaming)?'bg-gray-400':'bg-teal-600 hover:bg-teal-700'}`}>{sending?'Enviando…':'Enviar (sync)'}</button>
            <button onClick={sendStream} disabled={!chatId||streaming||sending||!input.trim()} className={`px-3 py-2 rounded-md text-white ${(!chatId||streaming||sending)?'bg-gray-400':'bg-indigo-600 hover:bg-indigo-700'}`}>{streaming?'Transmitindo…':'Enviar (stream)'}</button>
          </div>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">Erro: {error}</div>}
      </div>
    </div>
  )
}

