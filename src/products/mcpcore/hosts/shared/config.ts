import { PluginError } from '../../shared/contracts'
import { serviceUrl, type PluginConfig } from '../../shared/config'
import type { Host } from './instructions'

// Same rules for every host; only the variable prefix, the MCP path and the host's own origin change.
// Variable names stay as they are in production (CHATGPTPLUGIN_*, CLAUDEPLUGIN_*).
type HostSettings = { host: Host; prefix: 'CHATGPTPLUGIN' | 'CLAUDEPLUGIN'; path: string; origin: string; extra?: Partial<PluginConfig> }
export function hostConfig({ host, prefix, path, origin, extra }: HostSettings): PluginConfig {
  const env = (name: string) => process.env[`${prefix}_${name}`]
  const base = serviceUrl(env('BASE_URL'), `${prefix}_BASE_URL`, true)
  const issuer = serviceUrl(env('OAUTH_ISSUER'), `${prefix}_OAUTH_ISSUER`)
  if (base.pathname !== '/' || issuer.pathname !== '/') throw new PluginError('CONFIGURATION_REQUIRED', 'Configure URLs de origem, sem caminhos.', 503)
  // With dynamic registration (DCR) each connection gets a new client_id: use '*'. Otherwise list the accepted ones.
  const clientIds = (env('OAUTH_CLIENT_IDS') || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!clientIds.length) throw new PluginError('CONFIGURATION_REQUIRED', 'Configure os clientes OAuth autorizados.', 503)
  return {
    integration: host,
    resource: `${base.origin}${path}`, issuer: issuer.origin,
    metadataUrl: `${base.origin}/.well-known/oauth-protected-resource${path}`,
    scope: 'erp:read', clientIds,
    origins: [base.origin, origin, ...(env('ALLOWED_ORIGINS') || '').split(',').filter(Boolean).map(v => serviceUrl(v.trim(), `${prefix}_ALLOWED_ORIGINS`, true).origin)],
    toolTimeoutMs: 15000, requestsPerMinute: 60,
    ...extra,
  }
}
