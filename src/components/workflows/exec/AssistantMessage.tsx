"use client"

import type { UIMessage } from 'ai'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'

type TextPart = { type: 'text'; text: string }
type ReasoningPart = { type: 'reasoning'; content?: string; text?: string; state?: string }

const isTextPart = (p: unknown): p is TextPart => {
  const t = (p as { type?: string; text?: unknown })?.type
  return t === 'text' && typeof (p as { text?: unknown }).text === 'string'
}

const isReasoningPart = (p: unknown): p is ReasoningPart => {
  const t = (p as { type?: string })?.type
  return t === 'reasoning'
}

export default function AssistantMessage({ message }: { message: UIMessage }) {
  const parts = (message.parts || []) as unknown[]
  const texts = parts.filter(isTextPart)
  const reasonings = parts.filter(isReasoningPart)

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
