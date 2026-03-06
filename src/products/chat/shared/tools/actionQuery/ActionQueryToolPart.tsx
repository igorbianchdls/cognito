"use client"

import type { ToolUIPart } from 'ai'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { extractActionQueryToolViewModel } from '@/products/chat/shared/tools/actionQuery/toViewModel'
import { ActionQueryArtifactCard } from '@/products/chat/shared/tools/actionQuery/ActionQueryArtifactCard'

export function ActionQueryToolPart({
  part,
  idx,
  toolName,
}: {
  part: AgentToolPartLike
  idx: number
  toolName: 'ecommerce' | 'marketing'
}) {
  const callId = part.toolCallId || String(idx)
  const t = part.type as string
  const model = part.state === 'output-available' ? extractActionQueryToolViewModel(toolName, part.output) : null

  return (
    <div key={`t-${callId}`} className="space-y-2">
      <Tool defaultOpen={false}>
        <ToolHeader type={t as ToolUIPart['type']} state={part.state as ToolUIPart['state']} />
        <ToolContent>
          {part.input !== undefined ? <ToolInput input={part.input as ToolUIPart['input']} /> : null}
          {part.state === 'output-error' ? <ToolOutput output={null} errorText={part.errorText} /> : null}
        </ToolContent>
      </Tool>
      {part.state === 'output-available' && (
        model ? (
          <ToolOutput output={<ActionQueryArtifactCard model={model} />} errorText={undefined} />
        ) : (
          <ToolOutput
            output={<pre className="text-xs whitespace-pre-wrap">{JSON.stringify(part.output, null, 2)}</pre>}
            errorText={undefined}
          />
        )
      )}
    </div>
  )
}
