'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

type ResponsesSomeResponse = {
  ok?: boolean
  sessionId?: string
  error?: string
}

type StreamStats = {
  eventCounts?: Record<string, number>
  unknownEventCounts?: Record<string, number>
  assistantChars?: number
  reasoningChars?: number
}

const ENDPOINT = '/api/bigquery-test/responses-some'

const IDEA_STARTERS = [
  'Me ajude a desenhar um plano de execução para esta semana.',
  'Quero brainstorm de produto para um MVP B2B.',
  'Faça perguntas para eu tomar uma decisão difícil com clareza.',
  'Monte hipóteses para aumentar conversão no funil.',
]

function formatTime(value: number) {
  try {
    return new Date(value).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '--:--'
  }
}

function parseSseChunk(chunk: string): { event: string; data: string } | null {
  const lines = chunk.split('\n')
  let event = 'message'
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }
  if (!dataLines.length) return null
  return { event, data: dataLines.join('\n') }
}

function parseStreamError(raw: string) {
  const text = raw.trim()
  if (!text) return 'Erro no stream da IA'
  try {
    const parsed = JSON.parse(text) as unknown
    if (typeof parsed === 'string' && parsed.trim()) return parsed.trim()
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const maybeError = (parsed as { error?: unknown }).error
      if (typeof maybeError === 'string' && maybeError.trim()) return maybeError.trim()
    }
    return text
  } catch {
    return text
  }
}

export default function ResponsesSomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasoningText, setReasoningText] = useState('')
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)

  const canSend = input.trim().length > 0 && !loading
  const statusLabel = useMemo(() => {
    if (loading) return 'Respondendo...'
    if (sessionId) return 'Conectado'
    return 'Pronto'
  }, [loading, sessionId])

  useEffect(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages, loading])

  const sendMessage = async (raw: string) => {
    const text = raw.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      createdAt: Date.now(),
    }
    const assistantId = `assistant-${Date.now() + 1}`
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setError(null)
    setReasoningText('')
    setReasoningOpen(false)
    setStreamStats(null)
    setLoading(true)

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-stream',
          sessionId,
          message: text,
          previousResponseId: responseId,
        }),
      })
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as ResponsesSomeResponse
        throw new Error(data.error || `Erro ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sawDelta = false
      let sawFinal = false

      const applyAssistantChunk = (chunk: string) => {
        if (!chunk) return
        sawDelta = true
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg))
        )
      }

      const applyAssistantFull = (full: string) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, text: full } : msg))
        )
      }

      const consumePayload = (rawPayload: string, eventName: string) => {
        if (!rawPayload) return
        if (eventName === 'meta') {
          try {
            const meta = JSON.parse(rawPayload) as { sessionId?: string }
            if (meta.sessionId && meta.sessionId.trim()) {
              setSessionId(meta.sessionId.trim())
            }
          } catch {
            // ignore meta parse error
          }
          return
        }
        if (eventName === 'stderr') {
          return
        }
        if (eventName === 'error') {
          throw new Error(parseStreamError(rawPayload))
        }
        if (eventName === 'start' || eventName === 'end') {
          return
        }

        let evt: any = null
        try {
          evt = JSON.parse(rawPayload)
        } catch {
          return
        }
        if (!evt || typeof evt !== 'object') return

        if (evt.type === 'response_created' && typeof evt.responseId === 'string' && evt.responseId.trim()) {
          setResponseId(evt.responseId.trim())
          return
        }
        if (evt.type === 'completed' && typeof evt.responseId === 'string' && evt.responseId.trim()) {
          setResponseId(evt.responseId.trim())
          return
        }
        if (evt.type === 'delta' && typeof evt.text === 'string') {
          applyAssistantChunk(evt.text)
          return
        }
        if (evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
          if (!evt.text) return
          setReasoningOpen(true)
          setReasoningText((prev) => prev + evt.text)
          return
        }
        if (evt.type === 'final') {
          sawFinal = true
          if (typeof evt.responseId === 'string' && evt.responseId.trim()) {
            setResponseId(evt.responseId.trim())
          }
          if (typeof evt.text === 'string') {
            if (!sawDelta) applyAssistantFull(evt.text)
            if (!evt.text.trim() && !sawDelta) applyAssistantFull('(sem resposta textual)')
          }
          return
        }
        if (evt.type === 'stream_stats' && evt && typeof evt === 'object') {
          setStreamStats({
            eventCounts:
              evt.eventCounts && typeof evt.eventCounts === 'object'
                ? (evt.eventCounts as Record<string, number>)
                : undefined,
            unknownEventCounts:
              evt.unknownEventCounts && typeof evt.unknownEventCounts === 'object'
                ? (evt.unknownEventCounts as Record<string, number>)
                : undefined,
            assistantChars:
              typeof evt.assistantChars === 'number' ? evt.assistantChars : undefined,
            reasoningChars:
              typeof evt.reasoningChars === 'number' ? evt.reasoningChars : undefined,
          })
          return
        }
        if (evt.type === 'error') {
          throw new Error(typeof evt.error === 'string' ? evt.error : 'Erro no stream da IA')
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')

        let idx = -1
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const rawChunk = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const parsed = parseSseChunk(rawChunk)
          if (!parsed) continue
          consumePayload(parsed.data, parsed.event)
        }
      }

      if (buffer.trim()) {
        const parsed = parseSseChunk(buffer)
        if (parsed) consumePayload(parsed.data, parsed.event)
      }

      if (!sawDelta && !sawFinal) {
        applyAssistantFull('(sem resposta textual)')
      }
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err)
      setError(messageText)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId && !msg.text.trim()
            ? { ...msg, text: 'Erro ao receber resposta da IA.' }
            : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await sendMessage(input)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!canSend) return
      void sendMessage(input)
    }
  }

  const stopSession = async () => {
    if (!sessionId) return
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', sessionId }),
      })
    } catch {
      // ignore
    }
  }

  const startNewConversation = async () => {
    await stopSession()
    setSessionId(null)
    setResponseId(null)
    setMessages([])
    setError(null)
    setReasoningText('')
    setReasoningOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[calc(100vh-3rem)]">
        <header className="border-b border-slate-200 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 md:text-xl">Responses API Chat</h1>
              <p className="text-xs text-slate-500 md:text-sm">
                Streaming via OpenAI Responses API executando dentro da sandbox.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  loading ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={startNewConversation}
                disabled={loading}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Novo chat
              </button>
              <button
                type="button"
                onClick={() => setReasoningOpen((prev) => !prev)}
                disabled={!reasoningText}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {reasoningOpen ? 'Ocultar thinking' : 'Mostrar thinking'}
              </button>
            </div>
          </div>
          <div className="mt-2 grid gap-1 text-[11px] text-slate-500 md:grid-cols-2">
            <div>
              <span className="font-medium">Session ID:</span>{' '}
              <code>{sessionId || 'será criada no primeiro envio'}</code>
            </div>
            <div>
              <span className="font-medium">Response ID:</span>{' '}
              <code>{responseId || 'ainda não iniciado'}</code>
            </div>
          </div>
          {error && (
            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          {reasoningOpen && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="mb-1 font-semibold">Thinking</div>
              <div className="whitespace-pre-wrap break-words">
                {reasoningText || 'Sem reasoning desta resposta.'}
              </div>
            </div>
          )}
          {streamStats && (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <div className="mb-1 font-semibold">Stream Stats</div>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(streamStats, null, 2)}
              </pre>
            </div>
          )}
        </header>

        <div ref={feedRef} className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 md:px-6">
          {!messages.length && (
            <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Envie uma mensagem e acompanhe o texto chegando em streaming em tempo real.
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-900'
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                    {message.role === 'user' ? 'Você' : 'IA'}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</pre>
                  <div className="mt-2 text-[10px] opacity-60">{formatTime(message.createdAt)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Gerando resposta...
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white px-3 py-3 md:px-6">
          {!messages.length && (
            <div className="mb-3 flex flex-wrap gap-2">
              {IDEA_STARTERS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setInput(idea)}
                  disabled={loading}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={3}
              placeholder="Troque ideias com a IA... (Enter envia, Shift+Enter quebra linha)"
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {loading
                  ? 'Aguarde a resposta antes de enviar outra mensagem.'
                  : 'Conversa contextual usando previous_response_id.'}
              </span>
              <button
                type="submit"
                disabled={!canSend}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  canSend ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400'
                }`}
              >
                Enviar
              </button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  )
}
