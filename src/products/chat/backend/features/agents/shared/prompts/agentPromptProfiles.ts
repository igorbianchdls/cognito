import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { PromptHistoryMessage } from '@/products/chat/backend/features/agents/shared/prompts/promptConversation'

export type AgentPromptProfile = 'general' | 'data_analyst'

type ResolveProfileInput = {
  requestedProfile?: string | null
  history?: PromptHistoryMessage[]
}

const PROFILE_FILES: Record<AgentPromptProfile, string> = {
  general: 'generalAgent.md',
  data_analyst: 'dataAnalystAgent.md',
}

const PROFILE_CACHE = new Map<AgentPromptProfile, string>()

export function normalizeAgentPromptProfile(raw?: string | null): AgentPromptProfile | null {
  const value = String(raw || '').trim().toLowerCase()
  if (!value) return null
  if (value === 'general' || value === 'default' || value === 'normal') return 'general'
  if (value === 'data_analyst' || value === 'data-analyst' || value === 'analyst' || value === 'analista') {
    return 'data_analyst'
  }
  return null
}

export function resolveAgentPromptProfile(input: ResolveProfileInput): AgentPromptProfile {
  const envProfile = normalizeAgentPromptProfile(process.env.AGENT_PROMPT_PROFILE)
  if (envProfile) return envProfile

  const requested = normalizeAgentPromptProfile(input.requestedProfile)
  if (requested) return requested

  return 'data_analyst'
}

export function readAgentPromptMarkdown(profile: AgentPromptProfile): string {
  const cached = PROFILE_CACHE.get(profile)
  if (cached) return cached

  const filename = PROFILE_FILES[profile]
  const absolutePath = path.join(
    process.cwd(),
    'src/products/chat/backend/features/agents/shared/prompts',
    filename,
  )

  const content = readFileSync(absolutePath, 'utf8').trim()
  PROFILE_CACHE.set(profile, content)
  return content
}
