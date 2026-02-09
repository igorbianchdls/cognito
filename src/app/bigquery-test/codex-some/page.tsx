'use client'

import { useState, type FormEvent } from 'react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type CodexSomeResponse = {
  ok?: boolean
  reply?: string
  threadId?: string
  error?: string
}

const ENDPOINT = '/api/bigquery-test/codex-some'

export default function CodexSomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('Responda em 1 frase: este teste de Codex SDK está funcionando?')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
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
          message: text,
          threadId,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as CodexSomeResponse
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Erro ${response.status}`)
      }

      if (data.threadId && data.threadId.trim()) {
        setThreadId(data.threadId.trim())
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        text: data.reply || '(sem resposta textual)',
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err)
      setError(messageText)
    } finally {
      setLoading(false)
    }
  }

  const startNewConversation = () => {
    setThreadId(null)
    setMessages([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Codex Some — Chat de teste</h1>
        <p className="mb-4 text-sm text-gray-600">
          Subrota de tese para validar Codex SDK sem sandbox.
        </p>

        <div className="mb-4 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
          <div>
            <span className="font-medium">Endpoint:</span> <code>{ENDPOINT}</code>
          </div>
          <div className="mt-1">
            <span className="font-medium">Thread ID:</span>{' '}
            <code>{threadId || 'nenhuma (nova conversa)'}</code>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua mensagem para o Codex"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-md px-4 py-2 text-sm text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={startNewConversation}
                disabled={loading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Nova conversa
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md border p-3 text-sm ${message.role === 'user' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="mb-1 font-medium text-gray-800">
                {message.role === 'user' ? 'Você' : 'Codex'}
              </div>
              <pre className="whitespace-pre-wrap text-gray-900">{message.text}</pre>
            </div>
          ))}

          {!messages.length && (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
              Envie uma mensagem para iniciar o teste do Codex SDK.
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Erro: {error}
          </div>
        )}
      </div>
    </div>
  )
}
