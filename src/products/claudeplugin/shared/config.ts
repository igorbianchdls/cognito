import { PluginError } from '@/products/mcpcore/shared/contracts'
import { serviceUrl, type PluginConfig } from '@/products/mcpcore/shared/config'

export const CLAUDEPLUGIN_MCP_PATH = '/api/claude/mcp'
export function getClaudePluginConfig(): PluginConfig {
  const base = serviceUrl(process.env.CLAUDEPLUGIN_BASE_URL, 'CLAUDEPLUGIN_BASE_URL', true)
  const issuer = serviceUrl(process.env.CLAUDEPLUGIN_OAUTH_ISSUER, 'CLAUDEPLUGIN_OAUTH_ISSUER')
  if (base.pathname !== '/' || issuer.pathname !== '/') {
    throw new PluginError('CONFIGURATION_REQUIRED', 'Configure URLs de origem, sem caminhos.', 503)
  }
  // Com registro dinâmico (DCR) cada conexão do Claude recebe um client_id novo: use '*'.
  // Com CIMD ou cliente cadastrado, liste os client_id aceitos.
  const clientIds = (process.env.CLAUDEPLUGIN_OAUTH_CLIENT_IDS || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!clientIds.length) throw new PluginError('CONFIGURATION_REQUIRED', 'Configure os clientes OAuth autorizados.', 503)
  return {
    integration: 'claude',
    resource: `${base.origin}${CLAUDEPLUGIN_MCP_PATH}`, issuer: issuer.origin,
    metadataUrl: `${base.origin}/.well-known/oauth-protected-resource${CLAUDEPLUGIN_MCP_PATH}`,
    scope: 'erp:read', clientIds,
    origins: [base.origin, 'https://claude.ai', ...(process.env.CLAUDEPLUGIN_ALLOWED_ORIGINS || '')
      .split(',').filter(Boolean).map(v => serviceUrl(v.trim(), 'CLAUDEPLUGIN_ALLOWED_ORIGINS', true).origin)],
    // O Claude espera até 240 s por chamada; o limite do ERP continua o mesmo do ChatGPT.
    toolTimeoutMs: 15000, requestsPerMinute: 60,
  }
}
