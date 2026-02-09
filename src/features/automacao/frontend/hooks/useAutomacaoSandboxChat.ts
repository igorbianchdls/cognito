'use client'

import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '@/features/automacao/shared/types'

export default function useAutomacaoSandboxChat() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Sandbox não iniciada. Clique em Iniciar para começar.' },
  ])
  const [events, setEvents] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const eventsEndRef = useRef<HTMLDivElement | null>(null)
  const [automationId, setAutomationId] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)
  const lastTsRef = useRef<string | null>(null)

  const [autoPrompt, setAutoPrompt] = useState<string>(
    'Escreva um parágrafo introdutório sobre nossa empresa.',
  )
  const [autoDelaySec, setAutoDelaySec] = useState<number>(10)
  const [scheduledAt, setScheduledAt] = useState<number | null>(null)
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const scheduleTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const appendEvent = (line: string) => {
    setEvents((prev) => [...prev.slice(-200), line])
  }

  const ensureStart = async (): Promise<string> => {
    if (chatId) return chatId

    const attempts = [0, 1000, 2000, 4000]
    let lastErr: Error | null = null

    for (let i = 0; i < attempts.length; i += 1) {
      try {
        const response = await fetch('/api/sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'chat-start' }),
        })

        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean
          chatId?: string
          error?: string
        }

        if (!response.ok || data.ok === false || !data.chatId) {
          throw new Error(data.error || `Erro ${response.status}`)
        }

        setChatId(data.chatId)
        setMessages([{ role: 'assistant', content: 'Sandbox iniciada. Envie sua mensagem.' }])
        appendEvent('✅ Sandbox iniciada')

        return data.chatId
      } catch (nextError) {
        lastErr = nextError as Error
        if (attempts[i] > 0) {
          await new Promise((resolve) => setTimeout(resolve, attempts[i]))
        }
      }
    }

    throw lastErr || new Error('Falha ao iniciar sandbox')
  }

  const handleStart = async () => {
    setStarting(true)
    setError(null)

    try {
      await ensureStart()
    } catch (nextError) {
      const message = (nextError as Error).message
      setError(message)
      appendEvent(`❌ Erro ao iniciar: ${message}`)
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    if (!chatId) return

    setStarting(true)
    setError(null)

    try {
      await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-stop', chatId }),
      })

      setChatId(null)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sandbox encerrada.' }])
      appendEvent('🛑 Sandbox encerrada')
    } catch (nextError) {
      const message = (nextError as Error).message
      setError(message)
      appendEvent(`❌ Erro ao encerrar: ${message}`)
    } finally {
      setStarting(false)
    }
  }

  const sendText = async (text: string) => {
    if (!text) return

    const id = chatId || (await ensureStart())
    setSending(true)
    setError(null)

    const base = [...messages, { role: 'user' as const, content: text }]
    const isSlash = text.startsWith('/')
    let assistantIndex = -1

    if (!isSlash) {
      setMessages([...base, { role: 'assistant', content: '' }])
      assistantIndex = base.length
    } else {
      setMessages(base)
    }

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSlash
            ? { action: 'chat-slash', chatId: id, prompt: text }
            : { action: 'chat-send-stream', chatId: id, history: base },
        ),
      })

      if (!response.ok || !response.body) {
        const bodyText = await response.text().catch(() => '')
        throw new Error(bodyText || `Erro ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() || ''

        for (const frame of frames) {
          const line = frame.split('\n').find((valueLine) => valueLine.startsWith('data: '))
          if (!line) continue

          const payload = line.slice(6)

          try {
            const event = JSON.parse(payload) as {
              type?: string
              text?: string
              tool_name?: string
              error?: string
              name?: string
              subtype?: string
            }

            if (event.type === 'delta' && typeof event.text === 'string') {
              if (assistantIndex >= 0) {
                setMessages((prev) => {
                  const next = prev.slice()
                  const current = next[assistantIndex]
                  if (current && current.role === 'assistant') {
                    current.content += event.text as string
                  }
                  return next
                })
              }
            } else if (event.type === 'reasoning_start') {
              appendEvent('🧠 Início do raciocínio')
            } else if (event.type === 'reasoning_end') {
              appendEvent('🧠 Fim do raciocínio')
            } else if (event.type === 'tool_start') {
              appendEvent(`🛠️ Tool start: ${event.tool_name || 'Tool'}`)
            } else if (event.type === 'tool_done') {
              appendEvent(`✅ Tool done: ${event.tool_name || 'Tool'}`)
            } else if (event.type === 'tool_error') {
              appendEvent(`❌ Tool error: ${event.tool_name || 'Tool'} — ${event.error || ''}`)
            } else if (event.type === 'subagent_start') {
              appendEvent(`🤖 Subagente iniciou: ${event.name || ''}`)
            } else if (event.type === 'subagent_stop') {
              appendEvent(`🤖 Subagente finalizou: ${event.name || ''}`)
            } else if (event.type === 'system' && event.subtype) {
              appendEvent(`ℹ️ System: ${event.subtype}`)
            }
          } catch {
            // ignore non-json frames
          }
        }
      }
    } catch (nextError) {
      const message = (nextError as Error).message
      setError(message)
      appendEvent(`❌ Erro no stream: ${message}`)
    } finally {
      setSending(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    setInput('')
    await sendText(text)
  }

  const scheduleRun = async () => {
    try {
      const delay = Math.max(1, Number(autoDelaySec) || 1)
      const fireAt = Date.now() + delay * 1000
      setScheduledAt(fireAt)
      setCountdownMs(fireAt - Date.now())

      if (scheduleTimerRef.current) {
        window.clearTimeout(scheduleTimerRef.current)
      }

      scheduleTimerRef.current = window.setTimeout(async () => {
        appendEvent(`⏱️ Disparando automação (delay ${delay}s) — preparando sandbox…`)

        try {
          try {
            await fetch('/api/automacao/events/emit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'automacao/sandbox/started',
                automationId: automationId || null,
                chatId,
              }),
            })
          } catch {
            // ignore
          }

          await ensureStart()
          await sendText(autoPrompt)
        } catch (nextError) {
          const message = (nextError as Error).message
          setError(message)
          appendEvent(`❌ Falha na execução agendada: ${message}`)
        }

        setScheduledAt(null)
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current)
        }
        countdownTimerRef.current = null
      }, delay * 1000) as unknown as number

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current)
      }

      countdownTimerRef.current = window.setInterval(() => {
        setCountdownMs(Math.max(0, fireAt - Date.now()))
      }, 200) as unknown as number

      let idToUse = automationId
      if (!idToUse) {
        idToUse =
          Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
        setAutomationId(idToUse)
      }

      try {
        await fetch('/api/automacao/events/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'automacao/sandbox/scheduled',
            automationId: idToUse,
            chatId,
            data: { fire_at: new Date(fireAt).toISOString(), delay_sec: delay },
          }),
        })
      } catch {
        // ignore
      }

      appendEvent(`🕒 Automação agendada para ${new Date(fireAt).toLocaleTimeString()}`)
    } catch (nextError) {
      const message = (nextError as Error).message
      setError(message)
      appendEvent(`❌ Falha ao agendar: ${message}`)
    }
  }

  const cancelSchedule = () => {
    if (scheduleTimerRef.current) {
      window.clearTimeout(scheduleTimerRef.current)
    }
    scheduleTimerRef.current = null

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
    }
    countdownTimerRef.current = null

    setScheduledAt(null)
    setCountdownMs(0)
    appendEvent('⛔ Agendamento cancelado')
  }

  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
    }

    if (!automationId && !chatId) return

    const poll = async () => {
      try {
        const params = new URLSearchParams()
        if (automationId) params.set('automationId', automationId)
        if (chatId) params.set('chatId', chatId)
        if (lastTsRef.current) params.set('after', lastTsRef.current)
        params.set('limit', '100')

        const response = await fetch(`/api/automacao/events/recent?${params.toString()}`, {
          cache: 'no-store',
        })

        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean
          rows?: Array<{
            id: number
            ts: string
            event_name: string
            source: string
            data?: any
          }>
        }

        if (response.ok && payload.ok && Array.isArray(payload.rows) && payload.rows.length) {
          const lines = payload.rows.map((row) => {
            const when = new Date(row.ts).toLocaleTimeString()
            const source = row.source || 'api'
            return `🟣 [${when}] ${row.event_name} · ${source}`
          })

          setEvents((prev) => [...prev.slice(-200), ...lines])
          lastTsRef.current = payload.rows[payload.rows.length - 1].ts
        }
      } catch {
        // ignore
      }
    }

    pollRef.current = window.setInterval(poll, 2000) as unknown as number
    void poll()

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
      }
      pollRef.current = null
    }
  }, [automationId, chatId])

  useEffect(() => {
    return () => {
      if (scheduleTimerRef.current) {
        window.clearTimeout(scheduleTimerRef.current)
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current)
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
      }
    }
  }, [])

  return {
    chatId,
    starting,
    sending,
    input,
    setInput,
    messages,
    events,
    error,
    eventsEndRef,
    autoPrompt,
    setAutoPrompt,
    autoDelaySec,
    setAutoDelaySec,
    scheduledAt,
    countdownMs,
    handleStart,
    handleStop,
    handleSend,
    sendText,
    scheduleRun,
    cancelSchedule,
  }
}
