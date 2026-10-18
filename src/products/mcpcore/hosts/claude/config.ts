import { hostConfig } from '../shared/config'

export const CLAUDEPLUGIN_MCP_PATH = '/api/claude/mcp'
// Claude waits up to 240 s per call; the ERP keeps the same 15 s limit as ChatGPT.
export const getClaudePluginConfig = () => hostConfig({ host: 'claude', prefix: 'CLAUDEPLUGIN', path: CLAUDEPLUGIN_MCP_PATH, origin: 'https://claude.ai' })
