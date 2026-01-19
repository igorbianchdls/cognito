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

  const onSubmit = (e: FormEvent) => {
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

    // Placeholder assistant reply (no backend yet)
    const assistantMessage: UIMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: '👋 Chat pronto. Conectaremos ao Claude Agent SDK em seguida para consultas BigQuery.'
        }
      ]
    }

    // Simulate short delay for UX
    setTimeout(() => {
      setMessages(prev => [...prev, assistantMessage])
      setStatus('idle')
    }, 200)
  }

  return (
    <NexusShell outerBg="#fdfdfd" contentClassName="p-2" className="h-full">
      <div className="h-full">
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

