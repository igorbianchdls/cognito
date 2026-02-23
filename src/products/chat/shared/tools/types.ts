import type { ToolUIPart } from 'ai'

export type AgentToolPartLike = ToolUIPart & {
  type?: string
  state?: string
  toolCallId?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

