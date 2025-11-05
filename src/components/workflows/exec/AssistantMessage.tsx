"use client"

import type { UIMessage } from 'ai'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'

export default function AssistantMessage({ message }: { message: UIMessage }) {
  const parts = message.parts || []
  const texts = parts.filter((p) => p.type === 'text') as Array<{ type: 'text'; text: string }>
  const reasonings = parts.filter((p) => (p as any).type === 'reasoning') as Array<{ type: 'reasoning'; content?: string; text?: string; state?: string }>

  return (
    <div className="space-y-2">
      {texts.map((t, idx) => (
        <div key={idx} className="whitespace-pre-wrap leading-6 text-[13px]">{t.text}</div>
      ))}
      {reasonings.map((r, idx) => {
        const content = r.content || r.text || ''
        const isStreaming = r.state === 'streaming'
        return (
          <Reasoning key={idx} isStreaming={isStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{content}</ReasoningContent>
          </Reasoning>
        )
      })}
    </div>
  )
}

