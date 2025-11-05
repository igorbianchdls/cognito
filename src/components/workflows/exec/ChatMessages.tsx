"use client"

import type { UIMessage } from 'ai'
import AssistantMessage from './AssistantMessage'

export default function ChatMessages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="text-sm">
          {m.role === 'user' ? (
            <div className="max-w-[80%] bg-gray-100 rounded-md px-3 py-2 inline-block whitespace-pre-wrap">{m.parts?.find(p => p.type === 'text')?.text || ''}</div>
          ) : (
            <AssistantMessage message={m} />
          )}
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-xs text-gray-500">Envie uma mensagem para executar o agente com o grafo atual.</div>
      )}
    </div>
  )
}

