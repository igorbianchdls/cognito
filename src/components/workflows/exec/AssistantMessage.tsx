"use client"

import type { UIMessage, ToolUIPart } from 'ai'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import WeatherCard from '@/components/tools/WeatherCard'
import GetTimeCard from '@/components/tools/GetTimeCard'

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

type AnyPart = { type?: string; state?: string; toolCallId?: string; input?: unknown; output?: unknown; errorText?: string }
const isToolPart = (p: unknown): p is ToolUIPart & AnyPart => {
  const t = (p as { type?: string })?.type
  return typeof t === 'string' && t.startsWith('tool-')
}

export default function AssistantMessage({ message }: { message: UIMessage }) {
  const parts = (message.parts || []) as unknown[]
  const texts = parts.filter(isTextPart)
  const reasonings = parts.filter(isReasoningPart)
  const tools = parts.filter(isToolPart)

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
      {tools.map((p, idx) => {
        const part = p as ToolUIPart & AnyPart
        const callId = part.toolCallId || String(idx)
        const shouldBeOpen = part.state === 'output-available' || part.state === 'output-error'
        const t = part.type as string

        // Generic tool container
        const header = (
          <Tool defaultOpen={shouldBeOpen} key={callId}>
            <ToolHeader type={t as ToolUIPart['type']} state={part.state as ToolUIPart['state']} />
            <ToolContent>
              {part.input && <ToolInput input={part.input} />}
              {part.state === 'output-error' && (
                <ToolOutput output={null} errorText={part.errorText} />
              )}
            </ToolContent>
          </Tool>
        )

        // Tool-specific UI cards
        if (t === 'tool-getWeather' && part.state === 'output-available') {
          const out: any = part.output
          const data = out && typeof out === 'object' && 'data' in out ? (out as any).data : out
          return (
            <div key={`w-${callId}`} className="space-y-2">
              {header}
              {data ? <WeatherCard data={data as { location: string; temperature: number | string }} /> : null}
            </div>
          )
        }

        if (t === 'tool-getTime' && part.state === 'output-available') {
          const out: any = part.output
          const data = out && typeof out === 'object' && 'data' in out ? (out as any).data : out
          return (
            <div key={`tm-${callId}`} className="space-y-2">
              {header}
              {data ? <GetTimeCard data={data as { location: string; timezone: string; localTimeISO: string }} /> : null}
            </div>
          )
        }

        // Default: render only the generic container (parameters + result JSON)
        return (
          <div key={`t-${callId}`} className="space-y-2">
            {header}
            {part.state === 'output-available' && (
              <ToolOutput output={<pre className="text-xs whitespace-pre-wrap">{JSON.stringify(part.output, null, 2)}</pre>} errorText={undefined} />
            )}
          </div>
        )
      })}
    </div>
  )
}
