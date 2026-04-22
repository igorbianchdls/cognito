"use client";

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import type { UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import Header from './Header';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIa from './RespostaDaIa';
import InputArea from './InputArea';
import type { SandboxStatus } from '@/products/chat/shared/sandbox/status';
import { useChatErrorNotifications } from '@/products/chat/frontend/features/error-notifications/useChatErrorNotifications';

type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error'
type EngineId = 'claude-sonnet' | 'claude-haiku' | 'openai-gpt5' | 'openai-gpt5mini'
type RuntimeKind = 'codex' | 'agentsdk'
type PromptProfileId = 'general' | 'data_analyst' | 'dashboard_creator' | 'dashboard_analyst'

type ChatMessagesListProps = {
  messages: UIMessage[]
  status: ChatStatus
  currentAssistantId: string | null
}

const ChatMessagesList = React.memo(
  function ChatMessagesList({ messages, status, currentAssistantId }: ChatMessagesListProps) {
    return (
      <>
        {messages.map((m) =>
          m.role === 'user' ? (
            <PerguntaDoUsuario key={m.id} message={m} />
          ) : (
            <RespostaDaIa
              key={m.id}
              message={m}
              isPending={
                ((status === 'submitted' || status === 'streaming') &&
                  currentAssistantId === m.id &&
                  (!Array.isArray((m as any).parts) || (m as any).parts.length === 0))
              }
            />
          )
        )}
      </>
    )
  },
  (prev, next) =>
    prev.messages === next.messages &&
    prev.status === next.status &&
    prev.currentAssistantId === next.currentAssistantId,
)

function engineToBackend(engine: EngineId): { provider: string; model: string } {
  if (engine === 'claude-sonnet') return { provider: 'claude-agent', model: 'claude-sonnet-4-5-20251001' }
  if (engine === 'openai-gpt5') return { provider: 'openai-responses', model: 'gpt-5.4' }
  if (engine === 'openai-gpt5mini') return { provider: 'openai-responses', model: 'gpt-5.4-mini' }
  return { provider: 'claude-agent', model: 'claude-haiku-4-5-20251001' }
}

function modelToEngine(modelRaw?: string): EngineId {
  const model = (modelRaw || '').toString().trim().toLowerCase()
  if (!model) return 'openai-gpt5mini'
  if (model.includes('gpt-5.4-mini') || model.includes('gpt5.4-mini') || model.includes('gpt54mini')) return 'openai-gpt5mini'
  if (model.includes('gpt-5-mini') || model.includes('gpt5mini') || model.includes('gpt5-mini')) return 'openai-gpt5mini'
  if (model.includes('gpt-5.4') || model.includes('gpt5.4') || model.includes('gpt54')) return 'openai-gpt5'
  if (model.includes('gpt-5') || model.includes('gpt5') || model.includes('openai')) return 'openai-gpt5'
  if (model.includes('sonnet')) return 'claude-sonnet'
  return 'openai-gpt5mini'
}

function extractArtifactIdFromToolOutput(output: unknown): string | null {
  const visited = new Set<unknown>()

  const visit = (value: unknown): string | null => {
    if (value == null) return null
    if (typeof value === 'string') return null
    if (typeof value !== 'object') return null
    if (visited.has(value)) return null
    visited.add(value)

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = visit(item)
        if (nested) return nested
      }
      return null
    }

    const record = value as Record<string, unknown>
    const direct = record.artifact_id
    if (typeof direct === 'string' && direct.trim()) return direct.trim()

    for (const key of ['data', 'result', 'artifact']) {
      const nested = visit(record[key])
      if (nested) return nested
    }

    return null
  }

  return visit(output)
}

export default function ChatContainer({ withSideMargins, redirectOnFirstMessage, initialMessage, autoSendPrefill, initialChatId, initialEngine, runtimeKind = 'codex', workspaceOpen = false, onToggleWorkspace, onActivateArtifact }: { withSideMargins?: boolean; redirectOnFirstMessage?: boolean; initialMessage?: string; autoSendPrefill?: boolean; initialChatId?: string; initialEngine?: EngineId; runtimeKind?: RuntimeKind; workspaceOpen?: boolean; onToggleWorkspace?: () => void; onActivateArtifact?: (artifactId: string) => void }) {
  const router = useRouter()
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([])
  const isEmpty = messages.length === 0
  const [chatId, setChatId] = useState<string | null>(null)
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>('off')
  const [model, setModel] = useState<EngineId>(initialEngine || 'openai-gpt5mini')
  const [promptProfile, setPromptProfile] = useState<PromptProfileId>('dashboard_creator')
  const [startLocked, setStartLocked] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const pendingStartRef = useRef<Promise<string> | null>(null)
  const sendLockRef = useRef(false)
  const scrollRestoreDoneRef = useRef(false)
  // Track the assistant message for the current turn, so each user message
  // gets its own assistant response instead of appending to the first one.
  const currentAssistantIdRef = useRef<string | null>(null)
  const [menuBusy, setMenuBusy] = useState(false)
  const [headerTitle, setHeaderTitle] = useState<string | undefined>(undefined)
  const [hasPersistedChat, setHasPersistedChat] = useState<boolean>(false)
  const {
    notifications: errorNotifications,
    unreadCount: errorNotificationsUnread,
    pushErrorNotification,
    markAllAsRead,
    clearNotifications,
  } = useChatErrorNotifications()

  const notifyError = React.useCallback((source: 'sandbox' | 'api' | 'stream' | 'tool' | 'network' | 'unknown', error: unknown, message: string, details?: unknown) => {
    pushErrorNotification({ source, error, message, details })
  }, [pushErrorNotification])

  const getScrollKey = () => {
    if (!initialChatId) return null
    return `chat-scroll:${initialChatId}`
  }

  const saveScrollPosition = () => {
    const key = getScrollKey()
    const viewport = scrollViewportRef.current
    if (!key || !viewport) return
    try {
      sessionStorage.setItem(key, String(Math.max(0, Math.floor(viewport.scrollTop))))
    } catch {
      // ignore storage failures
    }
  }

  const restoreScrollPosition = () => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const key = getScrollKey()
    let restored = false
    if (key) {
      try {
        const raw = sessionStorage.getItem(key)
        const parsed = raw == null ? NaN : Number(raw)
        if (Number.isFinite(parsed) && parsed >= 0) {
          const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
          viewport.scrollTop = Math.min(parsed, maxScrollTop)
          restored = true
        }
      } catch {
        // ignore storage failures
      }
    }

    if (!restored) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }

  useEffect(() => {
    if (initialEngine) setModel(initialEngine)
  }, [initialEngine])

  useEffect(() => {
    scrollRestoreDoneRef.current = false
  }, [initialChatId])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    const onScroll = () => saveScrollPosition()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      saveScrollPosition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId, isEmpty])

  useEffect(() => {
    if (isEmpty) return
    if (scrollRestoreDoneRef.current) return
    const viewport = scrollViewportRef.current
    if (!viewport) return
    const raf = window.requestAnimationFrame(() => {
      restoreScrollPosition()
      scrollRestoreDoneRef.current = true
    })
    return () => window.cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, messages.length])

  useEffect(() => {
    if (isEmpty) return
    const onPageHide = () => saveScrollPosition()
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, initialChatId])

  // Ensure sandbox is closed when the user reloads/closes the tab.
  // This avoids stale "running" sessions after F5 and forces a clean start on next message.
  useEffect(() => {
    const activeChatId = chatId || initialChatId
    if (!activeChatId) return
    const stopOnExit = () => {
      if (sandboxStatus !== 'running') return
      const payload = JSON.stringify({ action: 'chat-stop', chatId: activeChatId })
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([payload], { type: 'application/json' })
          const sent = navigator.sendBeacon('/api/chat', blob)
          if (sent) return
        }
      } catch {
        // fallback below
      }
      try {
        void fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        })
      } catch {
        // ignore shutdown transport errors
      }
    }

    window.addEventListener('pagehide', stopOnExit)
    window.addEventListener('beforeunload', stopOnExit)
    return () => {
      window.removeEventListener('pagehide', stopOnExit)
      window.removeEventListener('beforeunload', stopOnExit)
    }
  }, [chatId, initialChatId, sandboxStatus])

  const startSandboxFromMenu = async () => {
    setMenuBusy(true)
    try { await ensureStart(); } catch (err) { setSandboxStatus('error'); notifyError('sandbox', err, 'Falha ao iniciar computador') } finally { setMenuBusy(false) }
  }
  const stopSandboxFromMenu = async () => {
    if (!chatId) return
    setMenuBusy(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-stop', chatId }) })
      const data = await res.json().catch(() => ({})) as any
      if (res.ok && data && data.ok) {
        setChatId(null)
        setSandboxStatus('off')
      } else {
        setSandboxStatus('error')
        notifyError('sandbox', data?.error, 'Falha ao fechar computador', data)
      }
    } catch (err) {
      setSandboxStatus('error')
      notifyError('sandbox', err, 'Falha ao fechar computador')
    } finally { setMenuBusy(false) }
  }

  const ensureStart = async () => {
    if (chatId) {
      setSandboxStatus('running')
      return chatId
    }
    if (pendingStartRef.current) return pendingStartRef.current

    const startPromise = (async () => {
      const resumeHint = Boolean(initialChatId && (hasPersistedChat || messages.length > 0))
      setSandboxStatus(resumeHint ? 'resuming' : 'starting')
      const body: any = { action: 'chat-start', runtimeKind }
      if (initialChatId && typeof initialChatId === 'string') body.chatId = initialChatId
      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json().catch(() => ({})) as {
          ok?: boolean
          chatId?: string
          runtimeKind?: RuntimeKind
          error?: string
          startupMode?: 'reused' | 'snapshot' | 'cold'
        }
        if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || 'chat-start failed')
        setChatId(data.chatId)
        setSandboxStatus('running')
        try {
          const cfg = engineToBackend(model)
          const modelRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'model-set', chatId: data.chatId, provider: cfg.provider, model: cfg.model }),
          })
          if (!modelRes.ok) {
            notifyError('api', `HTTP ${modelRes.status}`, 'Falha ao configurar modelo inicial')
          }
        } catch (err) {
          notifyError('api', err, 'Falha ao configurar modelo inicial')
        }
        return data.chatId
      } catch (error) {
        setSandboxStatus('error')
        throw error
      }
    })()

    pendingStartRef.current = startPromise
    setStartLocked(true)
    try {
      return await startPromise
    } finally {
      if (pendingStartRef.current === startPromise) pendingStartRef.current = null
      setStartLocked(false)
    }
  }

  const isSubmitBlocked = startLocked || sandboxStatus === 'starting' || sandboxStatus === 'resuming' || status === 'submitted' || status === 'streaming'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim()
    if (sendLockRef.current || isSubmitBlocked) return
    if (!text) return
    // If in first-message redirect mode and no chat started yet, redirect to /chat/<runtime>/[id]
    if (redirectOnFirstMessage && !chatId) {
      try {
        const urlId = (typeof window !== 'undefined' && (window as any).crypto?.randomUUID)
          ? (window as any).crypto.randomUUID()
          : (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
        try {
          sessionStorage.setItem(`first:${urlId}`, text)
          sessionStorage.setItem(`firstEngine:${urlId}`, model)
        } catch {}
        setStatus('submitted')
        setInput('')
        router.replace(`/chat/${runtimeKind}/${urlId}`)
        return
      } catch (err) {
        console.error('redirect error', err)
      }
    }
    // Normal path: send immediately
    send(text).catch(err => {
      console.error('chat send error', err)
      setStatus('error')
      notifyError('api', err, 'Falha ao enviar mensagem')
    })
    setInput('')
  };

  const send = async (text: string) => {
    if (sendLockRef.current) return
    sendLockRef.current = true
    try {
    setStatus('submitted')
    const id = await ensureStart()
    // Append user message
    const userMsg: UIMessage = { id: `u-${Date.now()}`, role: 'user', parts: [{ type: 'text', text }] }
    setMessages(prev => [...prev, userMsg])

    const isSlash = text.startsWith('/')
    // Pre-insert a new assistant placeholder for THIS turn and remember its id.
    const assistantId = `a-${Date.now()}`
    currentAssistantIdRef.current = assistantId
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', parts: [] as any }])

    // Stateless mode with short memory: keep only the last 10 user/assistant messages.
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
      .slice(-10)
    const body = isSlash
      ? { action: 'chat-slash', chatId: id, prompt: text, promptProfile }
      : { action: 'chat-send-stream', chatId: id, history, clientMessageId: userMsg.id, promptProfile }
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
    let activeTextPartId: string | null = null
    let textPartSeq = 0
    const appendToActiveText = (delta: string) => {
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx !== -1) {
          const parts = (copy[idx].parts || []).slice()
          let partId = activeTextPartId
          if (!partId) {
            partId = `txt-${Date.now()}-${++textPartSeq}`
            activeTextPartId = partId
            parts.push({ type: 'text', text: '', streamPartId: partId } as any)
          }
          let textIdx = parts.findIndex((p) => (p as any).type === 'text' && (p as any).streamPartId === partId)
          if (textIdx === -1) {
            parts.push({ type: 'text', text: '', streamPartId: partId } as any)
            textIdx = parts.length - 1
          }
          const cur = ((parts[textIdx] as any)?.text || '') as string
          parts[textIdx] = { ...(parts[textIdx] as any), type: 'text', text: cur + delta, streamPartId: partId } as any
          copy[idx] = { ...copy[idx], parts }
        }
        return copy
      })
    }
    const syncFinalAssistantText = (finalText: string) => {
      const nextText = String(finalText || '')
      if (!nextText) return
      ensureAssistantMessage()
      setMessages(prev => {
        const copy = prev.slice()
        const targetId = currentAssistantIdRef.current
        let idx = targetId ? copy.findIndex(m => m.id === targetId) : -1
        if (idx === -1) idx = copy.findIndex(m => m.role === 'assistant')
        if (idx === -1) return copy

        const parts = (copy[idx].parts || []).slice()
        const textIndexes: number[] = []
        let currentText = ''
        for (let partIdx = 0; partIdx < parts.length; partIdx += 1) {
          const part = parts[partIdx] as any
          if (part?.type === 'text' && typeof part?.text === 'string') {
            textIndexes.push(partIdx)
            currentText += part.text
          }
        }

        if (currentText === nextText) return copy

        let missing = ''
        if (!currentText) {
          missing = nextText
        } else if (nextText.startsWith(currentText)) {
          missing = nextText.slice(currentText.length)
        } else {
          return copy
        }

        if (!missing) return copy

        if (textIndexes.length > 0) {
          const lastTextIdx = textIndexes[textIndexes.length - 1]
          const currentPart = parts[lastTextIdx] as any
          parts[lastTextIdx] = {
            ...currentPart,
            type: 'text',
            text: String(currentPart?.text || '') + missing,
          } as any
        } else {
          parts.push({ type: 'text', text: missing } as any)
        }

        copy[idx] = { ...copy[idx], parts }
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
            parts.push(newPart)
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
    const toolCallIdToKey = new Map<string, string>()
    let toolKeySeq = 0
    const getToolCallKey = (evt: any, idx: number, bindIdx = false): string | null => {
      const rawCallId = (typeof evt?.call_id === 'string' && evt.call_id.trim())
        ? String(evt.call_id).trim()
        : ((typeof evt?.id === 'string' && evt.id.trim()) ? String(evt.id).trim() : '')
      if (rawCallId) {
        const existing = toolCallIdToKey.get(rawCallId)
        if (existing) {
          if (bindIdx) toolIndexToKey.set(idx, existing)
          return existing
        }
        if (!bindIdx) return null
        const key = `tc-${rawCallId}`
        toolCallIdToKey.set(rawCallId, key)
        if (bindIdx) toolIndexToKey.set(idx, key)
        return key
      }
      const existingIdx = toolIndexToKey.get(idx)
      if (existingIdx) return existingIdx
      if (!bindIdx) return null
      const key = `ti-${idx}-${++toolKeySeq}`
      if (bindIdx) toolIndexToKey.set(idx, key)
      return key
    }
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
            appendToActiveText(evt.text)
          } else if (evt && evt.type === 'reasoning_start') {
            ensureReasoningPart()
          } else if (evt && evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
            applyReasoningDelta(evt.text)
          } else if (evt && evt.type === 'reasoning_end') {
            endReasoning()
          } else if (evt && evt.type === 'tool_input_start') {
            activeTextPartId = null
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const callKey = getToolCallKey(evt, idx, true) || `ti-${idx}-${++toolKeySeq}`
            ensureToolPart(callKey, evt.name, 'input-streaming')
            lastActiveToolKey = callKey
          } else if (evt && evt.type === 'tool_input_delta' && typeof evt.partial === 'string') {
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const callKey = getToolCallKey(evt, idx, true) || `ti-${idx}-${++toolKeySeq}`
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
            const callKey = getToolCallKey(evt, idx, true) || `ti-${idx}-${++toolKeySeq}`
            let parsed: any = undefined
            try { if (typeof evt.input !== 'undefined') parsed = evt.input } catch {}
            updateToolPart(callKey, { state: 'input-available', input: parsed })
            lastActiveToolKey = callKey
          } else if (evt && evt.type === 'tool_start') {
            activeTextPartId = null
            if (!lastActiveToolKey) {
              const callKey = `ti-hook-${Date.now()}`
              ensureToolPart(callKey, (evt as any).tool_name, 'input-available')
              lastActiveToolKey = callKey
            } else {
              updateToolPart(lastActiveToolKey, { state: 'input-available' })
            }
          } else if (evt && evt.type === 'tool_done') {
            activeTextPartId = null
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const keyFromEvent: string | null = getToolCallKey(evt, idx, false)
            const targetKey: string | null = keyFromEvent || lastActiveToolKey
            // Ensure a tool part exists even if no prior tool_input/tool_start was observed
            if (!targetKey) {
              const callKey = `td-hook-${Date.now()}`
              ensureToolPart(callKey, (evt as any).tool_name, 'input-available')
              lastActiveToolKey = callKey
            } else {
              lastActiveToolKey = targetKey
            }
            if (lastActiveToolKey) {
              updateToolPart(lastActiveToolKey, { state: 'output-available', output: evt.output, type: `tool-${evt.tool_name || 'generic'}` })
            }
            const toolName = typeof evt.tool_name === 'string' ? evt.tool_name : ''
            if ((toolName === 'artifact_write' || toolName === 'artifact_patch') && onActivateArtifact) {
              const artifactId = extractArtifactIdFromToolOutput(evt.output)
              if (artifactId) onActivateArtifact(artifactId)
            }
          } else if (evt && evt.type === 'tool_error') {
            activeTextPartId = null
            const idx: number = typeof evt.index === 'number' ? evt.index : 0
            const keyFromEvent: string | null = getToolCallKey(evt, idx, false)
            const targetKey: string | null = keyFromEvent || lastActiveToolKey
            if (targetKey) {
              lastActiveToolKey = targetKey
              updateToolPart(lastActiveToolKey, { state: 'output-error', errorText: evt.error || 'Tool error', type: `tool-${evt.tool_name || 'generic'}` })
            }
            notifyError('tool', evt?.error, `Erro na tool ${evt?.tool_name || 'desconhecida'}`, evt)
          } else if (evt && evt.type === 'final') {
            if (typeof evt.text === 'string') syncFinalAssistantText(evt.text)
            setStatus('idle')
          } else if (evt && evt.type === 'error') {
            setStatus('error')
            const msg = typeof evt.error === 'string' ? evt.error : 'Erro no stream'
            appendToActiveText(`\n${msg}`)
            notifyError('stream', evt?.error, 'Erro no stream da resposta', evt)
          }
        } catch {}
      }
    }
    setStatus('idle')
    } finally {
      sendLockRef.current = false
    }
  }

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
          setHasPersistedChat(true)
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
          setHasPersistedChat(true)
          const dbModel = (data.chat.model || '').toString()
          if (dbModel) setModel(modelToEngine(dbModel))
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [initialChatId])

  // On hard reload, always require a fresh start/resume handshake on next send.
  // This prevents UI from showing "running" when backend local session/token is stale.
  useEffect(() => {
    if (!initialChatId || chatId) return
    setSandboxStatus('off')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId, chatId])
  // Auto-send prefilled first message when arriving at /chat/[id]
  useEffect(() => {
    if (autoSendPrefill && initialMessage && isEmpty && status === 'idle') {
      send(initialMessage).catch(err => {
        console.error('auto-send error', err)
        setStatus('error')
        notifyError('api', err, 'Falha ao enviar mensagem automática')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPrefill, initialMessage])
  if (isEmpty) {
    return (
      <div className="h-full grid grid-rows-[auto_1fr]">
        <Header
          title={headerTitle || 'Chat'}
          busy={menuBusy}
          hasSandbox={sandboxStatus === 'running'}
          sandboxStatus={sandboxStatus}
          onStartSandbox={startSandboxFromMenu}
          onStopSandbox={stopSandboxFromMenu}
          errorNotifications={errorNotifications}
          errorNotificationsUnread={errorNotificationsUnread}
          onMarkAllErrorNotificationsRead={markAllAsRead}
          onClearErrorNotifications={clearNotifications}
        />
        <div className="h-full min-h-0" style={withSideMargins ? { marginLeft: '20%', marginRight: '20%' } : undefined}>
          <div className="h-full px-4">
            <div className="h-full flex items-center justify-center">
              <div className="w-full text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">No que você está pensando hoje?</h1>
                <InputArea
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  status={status}
                  submitDisabled={isSubmitBlocked}
                  promptProfile={promptProfile}
                  onPromptProfileChange={setPromptProfile}
                  model={model}
                  onModelChange={async (m) => {
                    setModel(m)
                    if (redirectOnFirstMessage && !chatId) {
                      return
                    }
                    try {
                      const id = await ensureStart();
                      const cfg = engineToBackend(m)
                      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'model-set', chatId: id, provider: cfg.provider, model: cfg.model }) })
                      if (!res.ok) notifyError('api', `HTTP ${res.status}`, 'Falha ao alterar modelo')
                    } catch (err) {
                      notifyError('api', err, 'Falha ao alterar modelo')
                    }
                  }}
                  workspaceOpen={workspaceOpen}
                  onToggleWorkspace={onToggleWorkspace}
                />
                <p className="mt-2 text-xs text-gray-400 text-center">Alfred é uma IA e pode cometer erros. Por favor, verifique as respostas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-w-0 grid grid-rows-[auto_1fr]">
      <Header
        title={headerTitle || 'Chat'}
        busy={menuBusy}
        hasSandbox={sandboxStatus === 'running'}
        sandboxStatus={sandboxStatus}
        onStartSandbox={startSandboxFromMenu}
        onStopSandbox={stopSandboxFromMenu}
        errorNotifications={errorNotifications}
        errorNotificationsUnread={errorNotificationsUnread}
        onMarkAllErrorNotificationsRead={markAllAsRead}
        onClearErrorNotifications={clearNotifications}
      />
      <div className="h-full min-w-0 grid grid-rows-[1fr_auto] min-h-0" style={withSideMargins ? { marginLeft: '20%', marginRight: '20%' } : undefined}>
        <div ref={scrollViewportRef} className="overflow-y-auto overflow-x-hidden min-h-0 min-w-0 px-4 py-4">
          <ChatMessagesList
            messages={messages}
            status={status}
            currentAssistantId={currentAssistantIdRef.current}
          />
        </div>
        <div className="px-4 pb-3">
          <InputArea value={input} onChange={setInput} onSubmit={handleSubmit} status={status} submitDisabled={isSubmitBlocked} promptProfile={promptProfile} onPromptProfileChange={setPromptProfile} workspaceOpen={workspaceOpen} onToggleWorkspace={onToggleWorkspace} model={model} onModelChange={async (m) => {
            setModel(m)
            if (redirectOnFirstMessage && !chatId) {
              return
            }
            try {
              const id = await ensureStart();
              const cfg = engineToBackend(m)
              const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'model-set', chatId: id, provider: cfg.provider, model: cfg.model }) })
              if (!res.ok) notifyError('api', `HTTP ${res.status}`, 'Falha ao alterar modelo')
            } catch (err) {
              notifyError('api', err, 'Falha ao alterar modelo')
            }
          }} />
          <p className="mt-2 text-xs text-gray-400 text-center">Alfred é uma IA e pode cometer erros. Por favor, verifique as respostas.</p>
        </div>
      </div>
    </div>
  );
}
