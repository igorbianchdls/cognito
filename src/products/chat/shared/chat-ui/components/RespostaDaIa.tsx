"use client"

import type { ToolUIPart, UIMessage } from 'ai'
import { memo } from 'react'
import { Message } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { renderSharedToolPart } from '@/products/chat/shared/tools/toolRegistry'

type Props = { message: UIMessage; isPending?: boolean }

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function RespostaDaIa({ message, isPending = false }: Props) {
  const parts = Array.isArray(message.parts) ? message.parts : []
  const hasParts = parts.length > 0

  if (!hasParts && !isPending) return null

  return (
    <Message from="assistant" className="py-3">
      <div className="w-full min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <img
            src="/avatarAlfred.png"
            alt="Alfred"
            className="w-6 h-6 rounded-sm object-cover shadow-sm ml-0.5"
          />
          <span className="font-semibold text-gray-900 text-[16px]">Alfred</span>
        </div>

        {!hasParts && isPending && (
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
          </div>
        )}

        {parts.map((part: any, index: number) => {
          if (part?.type === 'text') {
            return (
              <Response
                key={`txt-${index}`}
                className="text-[15px] leading-6 text-gray-900 [&_p]:my-0 [&_ol]:my-0 [&_ul]:my-0"
              >
                {String(part?.text || '')}
              </Response>
            )
          }

          if (part?.type === 'reasoning') {
            const txt = String(part?.content ?? part?.text ?? '').trim()
            if (!txt) return null
            return (
              <Reasoning key={`rs-${index}`} isStreaming={String(part?.state || '') === 'streaming'}>
                <ReasoningTrigger />
                <ReasoningContent className="text-[12px] text-gray-300">{txt}</ReasoningContent>
              </Reasoning>
            )
          }

          if (typeof part?.type === 'string' && part.type.startsWith('tool-')) {
            const sharedToolPart = renderSharedToolPart(part, index)
            if (sharedToolPart) return sharedToolPart
            const rawState = String(part?.state || 'output-available')
            const toolState: ToolUIPart['state'] = (
              rawState === 'input-streaming' ||
              rawState === 'input-available' ||
              rawState === 'output-available' ||
              rawState === 'output-error'
            ) ? rawState : 'output-available'
            const type = String(part.type) as ToolUIPart['type']

            return (
              <div key={`tool-${index}`} className="space-y-2">
                <Tool defaultOpen={false}>
                  <ToolHeader type={type} state={toolState} />
                  <ToolContent>
                    {part?.input !== undefined ? (
                      <ToolInput input={part.input as ToolUIPart['input']} />
                    ) : null}
                    {part?.errorText ? (
                      <ToolOutput output={null} errorText={String(part.errorText)} />
                    ) : (
                      part?.output !== undefined ? (
                        <ToolOutput
                          output={<pre className="text-xs whitespace-pre-wrap">{pretty(part.output)}</pre>}
                          errorText={undefined}
                        />
                      ) : null
                    )}
                  </ToolContent>
                </Tool>
              </div>
            )
          }

          return null
        })}
      </div>
    </Message>
  )
}

export default memo(
  RespostaDaIa,
  (prev, next) => prev.message === next.message && prev.isPending === next.isPending,
)
