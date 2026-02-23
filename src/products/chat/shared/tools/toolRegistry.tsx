import type { ReactNode } from 'react'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { DocumentoToolPart } from '@/products/chat/shared/tools/documento/DocumentoToolPart'

export function renderSharedToolPart(part: AgentToolPartLike, idx: number): ReactNode | null {
  if (part.type === 'tool-documento') {
    return <DocumentoToolPart key={`tool-documento-${part.toolCallId || idx}`} part={part} idx={idx} />
  }
  return null
}

