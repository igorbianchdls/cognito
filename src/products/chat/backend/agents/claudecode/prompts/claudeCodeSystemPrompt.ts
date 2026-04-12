import {
  formatConversation,
  type PromptHistoryMessage,
} from '@/products/chat/backend/agents/shared/prompts/promptConversation'
import {
  readAgentPromptMarkdown,
  resolveAgentPromptProfile,
  type AgentPromptProfile,
} from '@/products/chat/backend/agents/shared/prompts/agentPromptProfiles'

const CLAUDE_EXTERNAL_TOOLS_ENABLED_BLOCK = `
<external_tools_runtime>
- Composio MCP está habilitado nesta sessão.
- Priorize tools internas (artifact_read, artifact_write, artifact_patch, crud, dashboard_builder, sql_execution, ecommerce, marketing, documento, drive, email).
- Use Composio para ações externas/cross-platform quando necessário.
- Antes de ações irreversíveis fora do ERP (ex.: envio externo), confirme intenção quando o contexto for ambíguo.
</external_tools_runtime>
`.trim()

const CLAUDE_EXTERNAL_TOOLS_DISABLED_BLOCK = `
<external_tools_runtime>
- Composio MCP não está habilitado nesta sessão.
- Use somente tools internas disponíveis: artifact_read, artifact_write, artifact_patch, crud, dashboard_builder, sql_execution, ecommerce, marketing, documento, drive e email.
</external_tools_runtime>
`.trim()

export function buildClaudeSystemPrompt(params: {
  history: PromptHistoryMessage[]
  composioEnabled: boolean
  profile?: AgentPromptProfile | string
}): string {
  const profile = resolveAgentPromptProfile({
    requestedProfile: params.profile,
    history: params.history,
  })

  const basePrompt = readAgentPromptMarkdown(profile)
  const runtimeBlock = params.composioEnabled
    ? CLAUDE_EXTERNAL_TOOLS_ENABLED_BLOCK
    : CLAUDE_EXTERNAL_TOOLS_DISABLED_BLOCK

  return `${basePrompt}\n\n${runtimeBlock}\n\n${formatConversation(params.history)}`.trim()
}
