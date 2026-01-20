import { Sandbox } from '@vercel/sandbox'

export type ChatSession = {
  id: string
  sandbox: Sandbox
  createdAt: number
  lastUsedAt: number
  mode: 'local'
}

// In-memory session store (process-local)
const SESSIONS = new Map<string, ChatSession>()

function genId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export { SESSIONS, genId }

