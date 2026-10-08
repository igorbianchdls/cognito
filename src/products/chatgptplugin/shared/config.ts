import { PluginError } from '@/products/mcpcore/shared/contracts'
import { serviceUrl, type PluginConfig } from '@/products/mcpcore/shared/config'

export type { PluginConfig } from '@/products/mcpcore/shared/config'
export function getPluginConfig(): PluginConfig {
  const base = serviceUrl(process.env.CHATGPTPLUGIN_BASE_URL, 'CHATGPTPLUGIN_BASE_URL', true)
  const issuer = serviceUrl(process.env.CHATGPTPLUGIN_OAUTH_ISSUER, 'CHATGPTPLUGIN_OAUTH_ISSUER')
  if (base.pathname !== '/' || issuer.pathname !== '/') {
    throw new PluginError('CONFIGURATION_REQUIRED', 'Configure URLs de origem, sem caminhos.', 503)
  }
  const clientIds = (process.env.CHATGPTPLUGIN_OAUTH_CLIENT_IDS || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!clientIds.length) throw new PluginError('CONFIGURATION_REQUIRED', 'Configure os clientes OAuth autorizados.', 503)
  return {
    integration: 'chatgpt',
    resource: `${base.origin}/api/mcp`, issuer: issuer.origin,
    metadataUrl: `${base.origin}/.well-known/oauth-protected-resource/api/mcp`,
    scope: 'erp:read', clientIds,
    origins: [base.origin, 'https://chatgpt.com', ...(process.env.CHATGPTPLUGIN_ALLOWED_ORIGINS || '')
      .split(',').filter(Boolean).map(v => serviceUrl(v.trim(), 'CHATGPTPLUGIN_ALLOWED_ORIGINS', true).origin)],
    toolTimeoutMs: 15000, requestsPerMinute: 60, nativeFormKey:process.env.CHATGPTPLUGIN_FORM_STATE_KEY,
  }
}
