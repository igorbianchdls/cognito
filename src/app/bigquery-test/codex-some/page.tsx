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

type CodexSomeResponse = {
  ok?: boolean
  sessionId?: string
  reply?: string
  threadId?: string
  error?: string
}

const ENDPOINT = '/api/bigquery-test/codex-some'

const IDEA_STARTERS = [
  'Me ajude a estruturar um plano de ação para a semana.',
  'Quero discutir uma estratégia para melhorar vendas B2B.',
  'Faça perguntas para me ajudar a clarear uma decisão importante.',
  'Quero brainstorming de produto com foco em MVP.',
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

export default function CodexSomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sessionId,
          message: text,
          threadId,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as CodexSomeResponse
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Erro ${response.status}`)
      }

      if (data.sessionId && data.sessionId.trim()) {
        setSessionId(data.sessionId.trim())
      }

      if (data.threadId && data.threadId.trim()) {
        setThreadId(data.threadId.trim())
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        text: data.reply || '(sem resposta textual)',
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err)
      setError(messageText)
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
    setThreadId(null)
    setMessages([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[calc(100vh-3rem)]">
        <header className="border-b border-slate-200 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 md:text-xl">Codex Some Chat</h1>
              <p className="text-xs text-slate-500 md:text-sm">
                Conversa contínua com IA usando Codex SDK em sandbox.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${loading ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
            </div>
          </div>
          <div className="mt-2 grid gap-1 text-[11px] text-slate-500 md:grid-cols-2">
            <div>
              <span className="font-medium">Session ID:</span>{' '}
              <code>{sessionId || 'será criada no primeiro envio'}</code>
            </div>
            <div>
              <span className="font-medium">Thread ID:</span>{' '}
              <code>{threadId || 'ainda não iniciado'}</code>
            </div>
          </div>
          {error && (
            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
        </header>

        <div ref={feedRef} className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 md:px-6">
          {!messages.length && (
            <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Comece com uma ideia e a IA te ajuda a explorar possibilidades, validar hipóteses e refinar decisões.
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-900'
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                    {message.role === 'user' ? 'Você' : 'Codex'}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</pre>
                  <div className="mt-2 text-[10px] opacity-60">{formatTime(message.createdAt)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Codex está pensando...
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
                {loading ? 'Aguarde a resposta antes de enviar outra mensagem.' : 'Conversa contextual no mesmo thread.'}
              </span>
              <button
                type="submit"
                disabled={!canSend}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${canSend ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400'}`}
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
