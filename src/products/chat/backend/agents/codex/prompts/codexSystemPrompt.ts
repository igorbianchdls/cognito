import {
  formatConversation,
  type PromptHistoryMessage,
} from '@/products/chat/backend/agents/shared/prompts/promptConversation'
import {
  readAgentPromptMarkdown,
  resolveAgentPromptProfile,
  type AgentPromptProfile,
} from '@/products/chat/backend/agents/shared/prompts/agentPromptProfiles'

export function buildOpenAiSystemPrompt(params: {
  history: PromptHistoryMessage[]
  profile?: AgentPromptProfile | string
}): string {
  const profile = resolveAgentPromptProfile({
    requestedProfile: params.profile,
    history: params.history,
  })

  const basePrompt = readAgentPromptMarkdown(profile)

  return `${basePrompt}\n\n${formatConversation(params.history)}`.trim()
}
