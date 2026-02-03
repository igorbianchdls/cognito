"use client"

import { useState } from "react"

type Resp = { ok?: boolean; chatId?: string; error?: string } & Record<string, any>

export default function SandboxStartTestPage() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)

  const append = (line: string) => setLog(prev => [...prev.slice(-200), line])

  const start = async () => {
    setBusy(true); setErr(null)
    try {
      append('→ POST /api/sandbox { action: "chat-start" }')
      const res = await fetch('/api/sandbox', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-start' })
      })
      const j = await res.json().catch(() => ({})) as Resp
      append(`← status ${res.status} ${JSON.stringify(j)}`)
      if (res.ok && j.ok && j.chatId) setChatId(j.chatId)
      else if (!res.ok || j.ok === false) setErr(j.error || `HTTP ${res.status}`)
    } catch (e) {
      setErr((e as Error).message)
      append(`! erro: ${(e as Error).message}`)
    } finally { setBusy(false) }
  }

  const stop = async () => {
    if (!chatId) return
    setBusy(true); setErr(null)
    try {
      append(`→ POST /api/sandbox { action: "chat-stop", chatId: ${chatId} }`)
      const res = await fetch('/api/sandbox', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-stop', chatId })
      })
      const j = await res.json().catch(() => ({})) as Resp
      append(`← status ${res.status} ${JSON.stringify(j)}`)
      if (res.ok && j.ok) setChatId(null)
      else if (!res.ok || j.ok === false) setErr(j.error || `HTTP ${res.status}`)
    } catch (e) {
      setErr((e as Error).message)
      append(`! erro: ${(e as Error).message}`)
    } finally { setBusy(false) }
  }

  const sendHello = async () => {
    if (!chatId) return
    setBusy(true); setErr(null)
    try {
      append(`→ POST /api/sandbox { action: "chat-send-stream", chatId: ${chatId}, history: [user:"Hello"] }`)
      const res = await fetch('/api/sandbox', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-send-stream', chatId, history: [{ role: 'user', content: 'Hello from tester. Diga apenas: OLÁ.' }] })
      })
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        append(`← status ${res.status} ${txt}`)
        if (!res.ok) setErr(txt || `HTTP ${res.status}`)
        return
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
          append(line.slice(6))
        }
      }
      append('← stream end')
    } catch (e) {
      setErr((e as Error).message)
      append(`! erro: ${(e as Error).message}`)
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white border rounded-xl shadow-sm p-4 space-y-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sandbox Starter — Tester</h1>
          <p className="text-sm text-gray-600">Sub‑rota: <code>/bigquery-test/sandbox/start</code>. Usa <code>/api/sandbox</code> para iniciar/parar e enviar uma mensagem.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={start} disabled={busy || !!chatId} className={`px-3 py-1.5 rounded text-white ${(!chatId && !busy) ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}>Iniciar</button>
          <button onClick={stop} disabled={busy || !chatId} className={`px-3 py-1.5 rounded text-white ${chatId ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'}`}>Parar</button>
          <button onClick={sendHello} disabled={busy || !chatId} className={`px-3 py-1.5 rounded text-white ${chatId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}>Enviar "Hello"</button>
          <div className="text-sm text-gray-700">chatId: <span className="font-mono text-gray-900">{chatId ?? '—'}</span></div>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="h-80 overflow-auto bg-gray-50 border rounded p-2 font-mono text-xs text-gray-800">
          {log.map((l, i) => (<div key={i} className="whitespace-pre-wrap break-all">{l}</div>))}
        </div>
        <div className="text-xs text-gray-500">Dica: verifique a variável de ambiente <code>ANTHROPIC_API_KEY</code> para streaming. O início da sandbox não depende dela.</div>
      </div>
    </div>
  )
}

