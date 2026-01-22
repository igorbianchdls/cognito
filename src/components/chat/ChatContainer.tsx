"use client";

import React, { useState, FormEvent, useRef } from 'react';
import type { UIMessage } from 'ai';
import Header from './Header';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIa from './RespostaDaIa';
import InputArea from './InputArea';

type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error'

export default function ChatContainer({ onOpenSandbox, withSideMargins }: { onOpenSandbox?: () => void; withSideMargins?: boolean }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [status, setStatus] = useState<ChatStatus>('idle')
  const abortRef = useRef<AbortController | null>(null)

  const ensureStart = async () => {
    if (chatId) return chatId
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-start' }) })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
    if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || 'chat-start failed')
    setChatId(data.chatId)
    return data.chatId
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim()
    if (!text) return
    send(text).catch(err => {
      console.error('chat send error', err)
      setStatus('error')
    })
    setInput('')
  };

  const send = async (text: string) => {
    const id = await ensureStart()
    // Append user message
    const userMsg: UIMessage = { id: `u-${Date.now()}`, role: 'user', parts: [{ type: 'text', text }] }
    setMessages(prev => [...prev, userMsg])

    const isSlash = text.startsWith('/')
    if (!isSlash) {
      const asstId = `a-${Date.now()}`
      setMessages(prev => [...prev, { id: asstId, role: 'assistant', parts: [{ type: 'text', text: '' }] }])
    }

    setStatus('submitted')
    const history = [...messages, userMsg].filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role as 'user'|'assistant', content: m.parts?.find(p=>p.type==='text')?.text || '' }))
    const body = isSlash ? { action: 'chat-slash', chatId: id, prompt: text } : { action: 'chat-send-stream', chatId: id, history }
    const ac = new AbortController(); abortRef.current = ac
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal })
    if (!res.ok || !res.body) throw new Error(await res.text().catch(()=> 'HTTP error'))
    setStatus('streaming')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    const applyDelta = (delta: string) => {
      setMessages(prev => {
        const copy = prev.slice()
        // Find last assistant
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const part = copy[i].parts?.[0]
            const cur = (part && (part as any).text) || ''
            const npart = { type: 'text', text: cur + delta } as any
            copy[i] = { ...copy[i], parts: [npart] }
            break
          }
        }
        return copy
      })
    }
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
          const evt = JSON.parse(payload) as any
          if (evt && evt.type === 'delta' && typeof evt.text === 'string') applyDelta(evt.text)
          if (evt && evt.type === 'final') setStatus('idle')
        } catch {}
      }
    }
    setStatus('idle')
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <Header />
      <div className="h-full grid grid-rows-[1fr_auto] min-h-0" style={withSideMargins ? { marginLeft: '20%', marginRight: '20%' } : undefined}>
        <div className="overflow-y-auto min-h-0 px-4 py-4">
          {messages.map((m) =>
            m.role === 'user' ? (
              <PerguntaDoUsuario key={m.id} message={m} />
            ) : (
              <RespostaDaIa key={m.id} message={m} />
            )
          )}
        </div>
        <div className="px-4 pb-3">
          <InputArea value={input} onChange={setInput} onSubmit={handleSubmit} status={status} onOpenSandbox={onOpenSandbox} />
        </div>
      </div>
    </div>
  );
}
