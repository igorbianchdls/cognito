import type { ReactNode } from 'react'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { DocumentoToolPart } from '@/products/chat/shared/tools/documento/DocumentoToolPart'
import { SqlExecutionToolPart } from '@/products/chat/shared/tools/sqlExecution/SqlExecutionToolPart'
import { ActionQueryToolPart } from '@/products/chat/shared/tools/actionQuery/ActionQueryToolPart'

export function renderSharedToolPart(part: AgentToolPartLike, idx: number): ReactNode | null {
  if (part.type === 'tool-documento') {
    return <DocumentoToolPart key={`tool-documento-${part.toolCallId || idx}`} part={part} idx={idx} />
  }
  if (part.type === 'tool-sql_execution') {
    return <SqlExecutionToolPart key={`tool-sql-execution-${part.toolCallId || idx}`} part={part} idx={idx} />
  }
  if (part.type === 'tool-ecommerce') {
    return <ActionQueryToolPart key={`tool-ecommerce-${part.toolCallId || idx}`} part={part} idx={idx} toolName="ecommerce" />
  }
  if (part.type === 'tool-marketing') {
    return <ActionQueryToolPart key={`tool-marketing-${part.toolCallId || idx}`} part={part} idx={idx} toolName="marketing" />
  }
  return null
}
