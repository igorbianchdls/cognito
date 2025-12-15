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

// Tool-specific data guards
type WeatherData = { location: string; temperature: number }
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const isWeatherDataLoose = (x: unknown): x is { location: string; temperature: number | string } => (
  isRecord(x) && typeof x.location === 'string' && (typeof x.temperature === 'number' || typeof x.temperature === 'string')
)
const extractWeatherData = (out: unknown): WeatherData | null => {
  // Accept either direct {location, temperature} or wrapped in { data: {...} }
  if (isWeatherDataLoose(out)) {
    const temp = typeof out.temperature === 'number' ? out.temperature : Number.parseFloat(String(out.temperature).replace(/[^0-9\.-]+/g, ''))
    return { location: out.location, temperature: Number.isFinite(temp) ? temp : 0 }
  }
  if (isRecord(out) && 'data' in out && isWeatherDataLoose((out as Record<string, unknown>).data)) {
    const d = (out as Record<string, unknown>).data as { location: string; temperature: number | string }
    const temp = typeof d.temperature === 'number' ? d.temperature : Number.parseFloat(String(d.temperature).replace(/[^0-9\.-]+/g, ''))
    return { location: d.location, temperature: Number.isFinite(temp) ? temp : 0 }
  }
  return null
}

type TimeData = { location: string; timezone: string; localTimeISO: string }
const isTimeDataLoose = (x: unknown): x is TimeData | { location: string; timezone: string; localTimeISO: string } => (
  isRecord(x) && typeof x.location === 'string' && typeof x.timezone === 'string' && typeof x.localTimeISO === 'string'
)
const extractTimeData = (out: unknown): TimeData | null => {
  if (isTimeDataLoose(out)) return out as TimeData
  if (isRecord(out) && 'data' in out && isTimeDataLoose((out as Record<string, unknown>).data)) {
    return (out as Record<string, unknown>).data as TimeData
  }
  return null
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
              {part.input !== undefined ? <ToolInput input={part.input as ToolUIPart['input']} /> : null}
              {part.state === 'output-error' ? (
                <ToolOutput output={null} errorText={part.errorText} />
              ) : null}
            </ToolContent>
          </Tool>
        )

        // Tool-specific UI cards
        if (t === 'tool-getWeather' && part.state === 'output-available') {
          const data = extractWeatherData(part.output)
          return (
            <div key={`w-${callId}`} className="space-y-2">
              {header}
              {data ? <WeatherCard data={data} /> : null}
            </div>
          )
        }

        if (t === 'tool-getTime' && part.state === 'output-available') {
          const data = extractTimeData(part.output)
          return (
            <div key={`tm-${callId}`} className="space-y-2">
              {header}
              {data ? <GetTimeCard data={data} /> : null}
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
