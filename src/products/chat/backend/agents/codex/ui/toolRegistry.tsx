import type { ReactNode } from 'react'
import type { AgentToolPartLike } from '@/products/chat/shared/tools/types'
import { renderSharedToolPart } from '@/products/chat/shared/tools/toolRegistry'

export function renderCodexToolPart(part: AgentToolPartLike, idx: number): ReactNode | null {
  return renderSharedToolPart(part, idx)
}

