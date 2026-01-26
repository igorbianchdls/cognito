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
    const ensureAssistantMessage = () => {
      setMessages(prev => {
        const copy = prev.slice()
        const hasAssistant = copy.some(m => m.role === 'assistant')
        if (!hasAssistant) {
          copy.push({ id: `a-${Date.now()}`, role: 'assistant', parts: [] as any })
        }
        return copy
      })
    }
    const ensureTextPartAtEnd = () => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = copy[i].parts || []
            const last = parts[parts.length - 1]
            if (!(last && (last as any).type === 'text')) {
              copy[i] = { ...copy[i], parts: [...parts, { type: 'text', text: '' } as any] }
            }
            break
          }
        }
        return copy
      })
    }
    const appendToTextEnd = (delta: string) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).slice()
            if (parts.length === 0 || (parts[parts.length - 1] as any).type !== 'text') {
              parts.push({ type: 'text', text: '' } as any)
            }
            const last = parts[parts.length - 1] as any
            const cur = (last && last.text) || ''
            parts[parts.length - 1] = { type: 'text', text: cur + delta } as any
            copy[i] = { ...copy[i], parts }
            break
          }
        }
        return copy
      })
    }
    const ensureReasoningPart = () => {
      ensureAssistantMessage()
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
      ensureAssistantMessage()
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
      ensureAssistantMessage()
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
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).slice()
            const idx = parts.findIndex(p => (p as any).toolCallId === callKey)
            if (idx === -1) {
              const newPart: any = {
                type: `tool-${(toolName || 'generic').toString()}`,
                state: (initialState as any) || 'input-streaming',
                toolCallId: callKey,
                inputStream: '',
              }
              // Insert before trailing text part (if any) to keep text at bottom
              const last = parts[parts.length - 1]
              if (last && (last as any).type === 'text') {
                parts.splice(parts.length - 1, 0, newPart)
              } else {
                parts.push(newPart)
              }
              copy[i] = { ...copy[i], parts }
            }
            break
          }
        }
        return copy
      })
    }
    const updateToolPart = (callKey: string, patch: Record<string, any>) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            const parts = (copy[i].parts || []).map(p => ((p as any).toolCallId === callKey) ? { ...(p as any), ...patch } : p)
            copy[i] = { ...copy[i], parts }
            break
          }
        }
        return copy
      })
    }

    // Tool correlation helpers
    const toolIndexToKey = new Map<number, string>()
    let lastActiveToolKey: string | null = null
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
            ensureTextPartAtEnd()
            appendToTextEnd(evt.text)
          } else if (evt && evt.type === 'reasoning_start') {
            ensureReasoningPart()
          } else if (evt && evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
            applyReasoningDelta(evt.text)
          } else if (evt && evt.type === 'reasoning_end') {
            endReasoning()
          } else if (evt && evt.type === 'tool_input_start') {
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const callKey = `ti-${idx}`
            ensureToolPart(callKey, evt.name, 'input-streaming')
            toolIndexToKey.set(idx, callKey)
            lastActiveToolKey = callKey
          } else if (evt && evt.type === 'tool_input_delta' && typeof evt.partial === 'string') {
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const callKey = toolIndexToKey.get(idx) || `ti-${idx}`
            ensureToolPart(callKey, evt.name, 'input-streaming')
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
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const callKey = toolIndexToKey.get(idx) || `ti-${idx}`
            let parsed: any = undefined
            try { if (typeof evt.input !== 'undefined') parsed = evt.input } catch {}
            updateToolPart(callKey, { state: 'input-available', input: parsed })
          } else if (evt && evt.type === 'tool_start') {
            if (!lastActiveToolKey) {
              const callKey = `ti-hook-${Date.now()}`
              ensureToolPart(callKey, (evt as any).tool_name, 'input-available')
              lastActiveToolKey = callKey
            } else {
              updateToolPart(lastActiveToolKey, { state: 'input-available' })
            }
          } else if (evt && evt.type === 'tool_done') {
            // Ensure a tool part exists even if no prior tool_input/tool_start was observed
            if (!lastActiveToolKey) {
              const callKey = `td-hook-${Date.now()}`
              ensureToolPart(callKey, (evt as any).tool_name, 'input-available')
              lastActiveToolKey = callKey
            }
            if (lastActiveToolKey) updateToolPart(lastActiveToolKey, { state: 'output-available', output: evt.output, type: `tool-${evt.tool_name || 'generic'}` })
          } else if (evt && evt.type === 'tool_error') {
            if (lastActiveToolKey) updateToolPart(lastActiveToolKey, { state: 'output-error', errorText: evt.error || 'Tool error', type: `tool-${evt.tool_name || 'generic'}` })
          } else if (evt && evt.type === 'final') {
            setStatus('idle')
          }
        } catch {}
      }
    }
    setStatus('idle')
  }

  const isEmpty = (messages || []).length === 0;
  if (isEmpty) {
    return (
      <div className="h-full grid grid-rows-[auto_1fr]">
        <Header />
        <div className="h-full min-h-0" style={withSideMargins ? { marginLeft: '20%', marginRight: '20%' } : undefined}>
          <div className="h-full px-4">
            <div className="h-full flex items-center justify-center">
              <div className="w-full text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Como você vai?</h1>
                <InputArea
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  status={status}
                  onOpenSandbox={async () => {
                    try { const id = await ensureStart(); onOpenSandbox?.(id); } catch { /* ignore */ }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
