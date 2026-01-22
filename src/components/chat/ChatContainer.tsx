"use client";

import React, { useState, FormEvent, useRef } from 'react';
import type { UIMessage } from 'ai';
import Header from './Header';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIa from './RespostaDaIa';
import InputArea from './InputArea';

type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error'

export default function ChatContainer({ onOpenSandbox, withSideMargins }: { onOpenSandbox?: (chatId: string) => void; withSideMargins?: boolean }) {
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
    const ensureReasoningPart = () => {
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = copy[i].parts || []
            const has = parts.some(p => (p as any).type === 'reasoning')
            if (!has) {
              const nextParts = [...parts, { type: 'reasoning', content: '', state: 'streaming' } as any]
              copy[i] = { ...copy[i], parts: nextParts }
            }
            break
          }
        }
        return copy
      })
    }
    const applyReasoningDelta = (delta: string) => {
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).map(p => {
              if ((p as any).type === 'reasoning') {
                const cur = (p as any).content || (p as any).text || ''
                return { ...(p as any), content: cur + delta, text: cur + delta }
              }
              return p
            })
            copy[i] = { ...copy[i], parts }
            break
          }
        }
        return copy
      })
    }
    const endReasoning = () => {
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).map(p => {
              if ((p as any).type === 'reasoning') {
                return { ...(p as any), state: 'done' }
              }
              return p
            })
            copy[i] = { ...copy[i], parts }
            break
          }
        }
        return copy
      })
    }
    const ensureToolPart = (callKey: string, toolName?: string, initialState?: string) => {
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = copy[i].parts || []
            const idx = parts.findIndex(p => (p as any).toolCallId === callKey)
            if (idx === -1) {
              const newPart: any = {
                type: `tool-${(toolName || 'generic').toString()}`,
                state: (initialState as any) || 'input-streaming',
                toolCallId: callKey,
                inputStream: '',
              }
              copy[i] = { ...copy[i], parts: [...parts, newPart] }
            }
            break
          }
        }
        return copy
      })
    }
    const updateToolPart = (callKey: string, patch: Record<string, any>) => {
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).map(p => {
              if ((p as any).toolCallId === callKey) {
                return { ...(p as any), ...patch }
              }
              return p
            })
            copy[i] = { ...copy[i], parts }
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
          if (evt && evt.type === 'delta' && typeof evt.text === 'string') {
            applyDelta(evt.text)
          } else if (evt && evt.type === 'reasoning_start') {
            ensureReasoningPart()
          } else if (evt && evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
            applyReasoningDelta(evt.text)
          } else if (evt && evt.type === 'reasoning_end') {
            endReasoning()
          } else if (evt && evt.type === 'tool_input_start') {
            const callKey = `ti-${evt.index ?? 0}`
            ensureToolPart(callKey, evt.name, 'input-streaming')
          } else if (evt && evt.type === 'tool_input_delta' && typeof evt.partial === 'string') {
            const callKey = `ti-${evt.index ?? 0}`
            ensureToolPart(callKey, evt.name, 'input-streaming')
            updateToolPart(callKey, (prev => {
              // We'll use a function-style patch by computing new inputStream outside
              return {} as any
            }) as any)
            // Manually update by reading and writing to avoid stale closures
            setMessages(prev => {
              const copy = prev.slice()
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i].role === 'assistant') {
                  const parts = (copy[i].parts || []).map(p => {
                    if ((p as any).toolCallId === callKey) {
                      const cur = ((p as any).inputStream || '') as string
                      return { ...(p as any), state: 'input-streaming', inputStream: cur + evt.partial }
                    }
                    return p
                  })
                  copy[i] = { ...copy[i], parts }
                  break
                }
              }
              return copy
            })
          } else if (evt && evt.type === 'tool_input_done') {
            const callKey = `ti-${evt.index ?? 0}`
            let parsed: any = undefined
            try { if (typeof evt.input !== 'undefined') parsed = evt.input } catch {}
            updateToolPart(callKey, { state: 'input-available', input: parsed })
          } else if (evt && evt.type === 'tool_start') {
            const callKey = `${evt.tool_name || 'tool'}-0`
            ensureToolPart(callKey, evt.tool_name, 'input-available')
            updateToolPart(callKey, { state: 'input-available' })
          } else if (evt && evt.type === 'tool_done') {
            const callKey = `${evt.tool_name || 'tool'}-0`
            updateToolPart(callKey, { state: 'output-available', output: evt.output })
          } else if (evt && evt.type === 'tool_error') {
            const callKey = `${evt.tool_name || 'tool'}-0`
            updateToolPart(callKey, { state: 'output-error', errorText: evt.error || 'Tool error' })
          } else if (evt && evt.type === 'final') {
            setStatus('idle')
          }
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
          <InputArea value={input} onChange={setInput} onSubmit={handleSubmit} status={status} onOpenSandbox={async () => {
            try { const id = await ensureStart(); onOpenSandbox?.(id); } catch { /* ignore */ }
          }} />
        </div>
      </div>
    </div>
  );
}
