"use client"

import { DefaultChatTransport, type UIMessage, type ChatStatus } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Graph } from '@/types/agentes/builder'
import ChatMessages from './ChatMessages'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'

export default function WorkflowRunChatPanel({ graph, className, autoSend }: { graph: Graph; className?: string; autoSend?: string }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/agentes/run-visual-chat', body: { graph } }), [graph])
  const { messages, status, sendMessage } = useChat({
    transport,
    id: 'workflow-run-panel',
  })
  const [text, setText] = useState('')

  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (autoSend) {
      void sendMessage({ text: autoSend })
    }
  }, [autoSend, sendMessage])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    void sendMessage({ text })
    setText('')
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="h-[52vh] overflow-auto custom-scrollbar p-3 bg-white">
        <ChatMessages messages={messages as UIMessage[]} />
      </div>
      <div className="p-3 border-t">
        <PromptInput onSubmit={onSubmit}>
          <PromptInputTextarea value={text} onChange={(e) => setText(e.target.value)} />
          <PromptInputToolbar>
            <PromptInputSubmit status={status as ChatStatus} disabled={!text} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}
