'use client'

import { useState, type FormEvent } from 'react'
import NexusShell from '@/components/navigation/nexus/NexusShell'
import ChatContainer from '@/components/navigation/nexus/ChatContainer'
import type { UIMessage } from 'ai'
import type { AttachedFile } from '@/components/navigation/nexus/FileAttachmentPreview'

export default function BigQueryIaChatPage() {
  // Local chat state (no backend wired yet)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setStatus('submitting')

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: trimmed }]
    }

    // Append user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    try {
      const res = await fetch('/api/bigquery-test/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        const msg = err?.error || `Erro ${res.status}`
        throw new Error(msg)
      }

      const data = await res.json() as { text?: string }
      const text = (data.text ?? '').trim() || 'Sem resposta.'

      const assistantMessage: UIMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        parts: [{ type: 'text', text }]
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const assistantMessage: UIMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `Erro: ${(error as Error).message}` }]
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setStatus('idle')
    }
  }

  return (
    <NexusShell outerBg="#fdfdfd" contentClassName="p-2" className="h-full">
      <div className="h-full" style={{ marginLeft: '20%', marginRight: '20%' }}>
        <ChatContainer
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          status={status}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          attachedFiles={attachedFiles}
          onFilesChange={setAttachedFiles}
          onInputFocus={() => {}}
          onOpenDashboard={() => {}}
        />
      </div>
    </NexusShell>
  )
}
