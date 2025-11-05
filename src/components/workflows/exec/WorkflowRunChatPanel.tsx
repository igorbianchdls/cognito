"use client"

import { useChat, DefaultChatTransport, type UIMessage } from 'ai'
import { useEffect, useMemo, useRef } from 'react'
import type { Graph } from '@/types/agentes/builder'
import RespostaDaIA from '@/components/nexus/RespostaDaIA'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'

export default function WorkflowRunChatPanel({ graph, className, autoSend }: { graph: Graph; className?: string; autoSend?: string }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/agentes/run-visual-chat' }), [])
  const { messages, input, setInput, status, append } = useChat({
    transport,
    body: { graph },
    id: 'workflow-run-panel',
  })

  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (autoSend) {
      void append({ role: 'user', content: [{ type: 'text', text: autoSend }] })
    }
  }, [autoSend])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    void append({ role: 'user', content: [{ type: 'text', text: input }] })
    setInput('')
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="h-[52vh] overflow-auto custom-scrollbar p-3 space-y-4 bg-white">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            {m.role === 'user' ? (
              <div className="max-w-[80%] bg-gray-100 rounded-md px-3 py-2 inline-block whitespace-pre-wrap">{m.parts?.find(p => p.type === 'text')?.text || ''}</div>
            ) : (
              <RespostaDaIA message={m as UIMessage} />
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-xs text-gray-500">Envie uma mensagem para executar o agente com o grafo atual.</div>
        )}
      </div>
      <div className="p-3 border-t">
        <PromptInput onSubmit={onSubmit}>
          <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} />
          <PromptInputToolbar>
            <PromptInputSubmit status={status as any} disabled={!input} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

