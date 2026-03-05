"use client"

import type { ToolUIPart } from 'ai'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { DocumentoArtifactCard } from '@/products/chat/shared/tools/documento/DocumentoArtifactCard'
import { extractDocumentoToolViewModel } from '@/products/chat/shared/tools/documento/toViewModel'

export function DocumentoToolPart({ part, idx }: { part: AgentToolPartLike; idx: number }) {
  const callId = part.toolCallId || String(idx)
  const t = part.type as string
  const model = part.state === 'output-available' ? extractDocumentoToolViewModel(part.input, part.output) : null

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
          <ToolOutput output={<DocumentoArtifactCard model={model} rawOutput={part.output} />} errorText={undefined} />
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
