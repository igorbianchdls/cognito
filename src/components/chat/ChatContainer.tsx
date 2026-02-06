"use client";

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import type { UIMessage } from 'ai';
import Header from './Header';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIa from './RespostaDaIa';
import InputArea from './InputArea';
import { useRouter } from 'next/navigation';

type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error'

export default function ChatContainer({ onOpenSandbox, withSideMargins, redirectOnFirstMessage, initialMessage, autoSendPrefill, initialChatId, autoStartSandbox }: { onOpenSandbox?: (chatId?: string) => void; withSideMargins?: boolean; redirectOnFirstMessage?: boolean; initialMessage?: string; autoSendPrefill?: boolean; initialChatId?: string; autoStartSandbox?: boolean }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [composioEnabled, setComposioEnabled] = useState<boolean>(false)
  const [model, setModel] = useState<'sonnet'|'haiku'>('haiku')
  const abortRef = useRef<AbortController | null>(null)
  // Track the assistant message for the current turn, so each user message
  // gets its own assistant response instead of appending to the first one.
  const currentAssistantIdRef = useRef<string | null>(null)
  const router = useRouter()
  const [menuBusy, setMenuBusy] = useState(false)
  const [headerTitle, setHeaderTitle] = useState<string | undefined>(undefined)

  const startSandboxFromMenu = async () => {
    setMenuBusy(true)
    try { await ensureStart(); } catch {} finally { setMenuBusy(false) }
  }
  const stopSandboxFromMenu = async () => {
    if (!chatId) return
    setMenuBusy(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-stop', chatId }) })
      const data = await res.json().catch(() => ({})) as any
      if (res.ok && data && data.ok) {
        setChatId(null)
      }
    } catch {} finally { setMenuBusy(false) }
  }
  const writeFilesFromMenu = async () => {
    setMenuBusy(true)
    try {
      const id = await ensureStart()
      const w1 = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId: id, path: '/vercel/sandbox/menu/hello.txt', content: 'Hello from menu' }) })
      if (!w1.ok) throw new Error('write hello failed')
      const w2 = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId: id, path: '/vercel/sandbox/menu/info.json', content: JSON.stringify({ when: new Date().toISOString(), via: 'menu' }) }) })
      if (!w2.ok) throw new Error('write info failed')
    } catch {} finally { setMenuBusy(false) }
  }

  const openArtifactFromMenu = async () => {
    try {
      const id = await ensureStart();
      onOpenSandbox?.(id);
    } catch {
      onOpenSandbox?.(chatId ?? undefined)
    }
  }

  const ensureStart = async () => {
    if (chatId) return chatId
    const body: any = { action: 'chat-start' }
    if (initialChatId && typeof initialChatId === 'string') body.chatId = initialChatId
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
    if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || 'chat-start failed')
    setChatId(data.chatId)
    return data.chatId
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim()
    if (!text) return
    // If in first-message redirect mode and no chat started yet, redirect to /chat/[id]
    if (redirectOnFirstMessage && !chatId) {
      try {
        const urlId = (typeof window !== 'undefined' && (window as any).crypto?.randomUUID)
          ? (window as any).crypto.randomUUID()
          : (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
        try { sessionStorage.setItem(`first:${urlId}`, text) } catch {}
        setStatus('submitted')
        setInput('')
        router.replace(`/chat/${urlId}`)
        return
      } catch (err) {
        console.error('redirect error', err)
      }
    }
    // Normal path: send immediately
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
    // Pre-insert a new assistant placeholder for THIS turn and remember its id.
    const assistantId = `a-${Date.now()}`
    currentAssistantIdRef.current = assistantId
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', parts: [] as any }])

    setStatus('submitted')
    // Stateless mode with short memory: keep only the last 3 user/assistant interactions.
    const history = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const content = (m.parts || [])
          .filter((p: any) => p?.type === 'text' && typeof p?.text === 'string')
          .map((p: any) => String(p.text))
          .join('\n')
          .trim()
        return { role: m.role as 'user'|'assistant', content }
      })
      .filter((m) => m.content.length > 0)
      .slice(-6)
    const body = isSlash
      ? { action: 'chat-slash', chatId: id, prompt: text }
      : { action: 'chat-send-stream', chatId: id, history, clientMessageId: userMsg.id }
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
        const targetId = currentAssistantIdRef.current
        if (targetId) {
          const exists = copy.some(m => m.id === targetId)
          if (!exists) copy.push({ id: targetId, role: 'assistant', parts: [] as any })
        } else {
          const newId = `a-${Date.now()}`
          currentAssistantIdRef.current = newId
          copy.push({ id: newId, role: 'assistant', parts: [] as any })
        }
        return copy
      })
    }
    const ensureTextPartAtEnd = () => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = copy[idx].parts || []
          const last = parts[parts.length - 1]
          if (!(last && (last as any).type === 'text')) {
            copy[idx] = { ...copy[idx], parts: [...parts, { type: 'text', text: '' } as any] }
          }
        }
        return copy
      })
    }
    const appendToTextEnd = (delta: string) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = (copy[idx].parts || []).slice()
          if (parts.length === 0 || (parts[parts.length - 1] as any).type !== 'text') {
            parts.push({ type: 'text', text: '' } as any)
          }
          const last = parts[parts.length - 1] as any
          const cur = (last && last.text) || ''
          parts[parts.length - 1] = { type: 'text', text: cur + delta } as any
          copy[idx] = { ...copy[idx], parts }
        }
        return copy
      })
    }
    const ensureReasoningPart = () => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = copy[idx].parts || []
          const has = parts.some(p => (p as any).type === 'reasoning')
          if (!has) {
            const nextParts = [...parts, { type: 'reasoning', content: '', state: 'streaming' } as any]
            copy[idx] = { ...copy[idx], parts: nextParts }
          }
        }
        return copy
      })
    }
    const applyReasoningDelta = (delta: string) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = (copy[idx].parts || []).map(p => {
            if ((p as any).type === 'reasoning') {
              const cur = (p as any).content || (p as any).text || ''
              return { ...(p as any), content: cur + delta, text: cur + delta }
            }
            return p
          })
          copy[idx] = { ...copy[idx], parts }
        }
        return copy
      })
    }
    const endReasoning = () => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = (copy[idx].parts || []).map(p => {
            if ((p as any).type === 'reasoning') {
              return { ...(p as any), state: 'done' }
            }
            return p
          })
          copy[idx] = { ...copy[idx], parts }
        }
        return copy
      })
    }
    const ensureToolPart = (callKey: string, toolName?: string, initialState?: string) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let i = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (i === -1) i = copy.findIndex(m => m.role === 'assistant')
        if (i !== -1) {
          const parts = (copy[i].parts || []).slice()
          const idx = parts.findIndex(p => (p as any).toolCallId === callKey)
          if (idx === -1) {
            const newPart: any = {
              type: `tool-${(toolName || 'generic').toString()}`,
              state: (initialState as any) || 'input-streaming',
              toolCallId: callKey,
              inputStream: '',
            }
            const last = parts[parts.length - 1]
            if (last && (last as any).type === 'text') {
              parts.splice(parts.length - 1, 0, newPart)
            } else {
              parts.push(newPart)
            }
            copy[i] = { ...copy[i], parts }
          }
        }
        return copy
      })
    }
    const updateToolPart = (callKey: string, patch: Record<string, any>) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let i = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (i === -1) i = copy.findIndex(m => m.role === 'assistant')
        if (i !== -1) {
          const parts = (copy[i].parts || []).map(p => ((p as any).toolCallId === callKey) ? { ...(p as any), ...patch } : p)
          copy[i] = { ...copy[i], parts }
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
  // Hydrate history when landing on /chat/[id] directly (no prefill auto-send)
  useEffect(() => {
    const shouldHydrate = Boolean(initialChatId) && isEmpty && !(autoSendPrefill && initialMessage)
    if (!shouldHydrate) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(initialChatId!)}&limit=50`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({})) as { ok?: boolean; items?: Array<{ id: string; role: 'user'|'assistant'|'tool'; content?: string; parts?: any; created_at: string }> }
        if (!cancelled && res.ok && data && data.ok && Array.isArray(data.items)) {
          const mapped = data.items.map((r) => ({
            id: r.id || `db-${r.created_at}`,
            role: (r.role === 'assistant' ? 'assistant' : 'user') as any,
            parts: (r.parts && Array.isArray(r.parts) && r.parts.length > 0)
              ? (r.parts as any)
              : ([{ type: 'text', text: r.content || '' }] as any)
          }))
          setMessages(mapped as any)
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId])

  // Load chat metadata (title) to show in header
  useEffect(() => {
    let cancelled = false
    if (!initialChatId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/chat/meta?chatId=${encodeURIComponent(initialChatId)}`, { cache: 'no-store' })
        const data = await res.json().catch(()=> ({})) as any
        if (!cancelled && res.ok && data && data.ok && data.chat) {
          const t = (data.chat.title || '').toString()
          if (t) setHeaderTitle(t)
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [initialChatId])

  // Auto-start sandbox (no message) when requested via URL flag
  useEffect(() => {
    if (autoStartSandbox && initialChatId && !chatId) {
      ensureStart().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSandbox, initialChatId])
  // Auto-send prefilled first message when arriving at /chat/[id]
  useEffect(() => {
    if (autoSendPrefill && initialMessage && isEmpty && status === 'idle') {
      send(initialMessage).catch(err => {
        console.error('auto-send error', err)
        setStatus('error')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPrefill, initialMessage])
  if (isEmpty) {
    return (
      <div className="h-full grid grid-rows-[auto_1fr]">
        <Header title={headerTitle || 'Chat'} busy={menuBusy} hasSandbox={!!chatId} onStartSandbox={startSandboxFromMenu} onStopSandbox={stopSandboxFromMenu} onWriteFiles={writeFilesFromMenu} onOpenArtifact={openArtifactFromMenu} />
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
                  composioEnabled={composioEnabled}
                  model={model}
                  onToggleComposio={async () => {
                    // Avoid starting chat before first message when redirecting
                    if (redirectOnFirstMessage && !chatId) {
                      setComposioEnabled(!composioEnabled)
                      return
                    }
                    try {
                      const id = await ensureStart();
                      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mcp-toggle', chatId: id, enabled: !composioEnabled }) });
                      const data = await res.json().catch(() => ({})) as any;
                      if (res.ok && data && data.ok) setComposioEnabled(Boolean(data.enabled));
                    } catch { /* ignore */ }
                  }}
                  onModelChange={async (m) => {
                    setModel(m)
                    if (redirectOnFirstMessage && !chatId) {
                      return
                    }
                    try {
                      const id = await ensureStart();
                      const modelId = m === 'haiku' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-5-20251001'
                      await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'model-set', chatId: id, model: modelId }) })
                    } catch { /* ignore */ }
                  }}
                  onOpenSandbox={async () => {
                    // Avoid starting chat before first message when redirecting
                    if (redirectOnFirstMessage && !chatId) { return }
                    try { const id = await ensureStart(); onOpenSandbox?.(id); } catch { /* ignore */ }
                  }}
                />
                <p className="mt-2 text-xs text-gray-400 text-center">Otto é uma IA e pode cometer erros. Por favor, verifique as respostas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <Header title={headerTitle || 'Chat'} busy={menuBusy} hasSandbox={!!chatId} onStartSandbox={startSandboxFromMenu} onStopSandbox={stopSandboxFromMenu} onWriteFiles={writeFilesFromMenu} onOpenArtifact={openArtifactFromMenu} />
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
          <InputArea value={input} onChange={setInput} onSubmit={handleSubmit} status={status} composioEnabled={composioEnabled} onToggleComposio={async () => {
            if (redirectOnFirstMessage && !chatId) {
              setComposioEnabled(!composioEnabled)
              return
            }
            try {
              const id = await ensureStart();
              const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mcp-toggle', chatId: id, enabled: !composioEnabled }) });
              const data = await res.json().catch(() => ({})) as any;
              if (res.ok && data && data.ok) setComposioEnabled(Boolean(data.enabled));
            } catch { /* ignore */ }
          }} model={model} onModelChange={async (m) => {
            setModel(m)
            if (redirectOnFirstMessage && !chatId) {
              return
            }
            try {
              const id = await ensureStart();
              const modelId = m === 'haiku' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-5-20251001'
              await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'model-set', chatId: id, model: modelId }) })
            } catch { /* ignore */ }
          }} onOpenSandbox={async () => {
            if (redirectOnFirstMessage && !chatId) { return }
            try { const id = await ensureStart(); onOpenSandbox?.(id); } catch { /* ignore */ }
          }} />
          <p className="mt-2 text-xs text-gray-400 text-center">Otto é uma IA e pode cometer erros. Por favor, verifique as respostas.</p>
        </div>
      </div>
    </div>
  );
}
