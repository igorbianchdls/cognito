"use client"

import type { ToolUIPart } from 'ai'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { CrudArtifactCard } from '@/products/chat/shared/tools/crud/CrudArtifactCard'
import { extractCrudToolViewModel, getCrudToolHeaderType } from '@/products/chat/shared/tools/crud/toViewModel'

export function CrudToolPart({ part, idx }: { part: AgentToolPartLike; idx: number }) {
  const callId = part.toolCallId || String(idx)
  const t = String(part.type || 'tool-crud')
  const headerType = getCrudToolHeaderType(part.input, t)
  const model = part.state === 'output-available' ? extractCrudToolViewModel(part.input, part.output) : null

  return (
    <div key={`t-${callId}`} className="space-y-2">
      <Tool defaultOpen={false}>
        <ToolHeader type={headerType} state={part.state as ToolUIPart['state']} />
        <ToolContent>
          {part.input !== undefined ? <ToolInput input={part.input as ToolUIPart['input']} /> : null}
          {part.state === 'output-error' ? <ToolOutput output={null} errorText={part.errorText} /> : null}
        </ToolContent>
      </Tool>
      {part.state === 'output-available' && (
        model ? (
          <ToolOutput output={<CrudArtifactCard model={model} />} errorText={undefined} />
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
