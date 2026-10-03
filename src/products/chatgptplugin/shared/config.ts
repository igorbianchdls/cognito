import { PluginError } from './contracts'

export type PluginConfig = {
  resource: string
  issuer: string
  metadataUrl: string
  scope: string
  clientIds: string[]
  origins: string[]
  toolTimeoutMs: number
  requestsPerMinute: number
  nativeFormKey?: string
}
function serviceUrl(value: string | undefined, name: string, local = false): URL {
  if (!value) throw new PluginError('CONFIGURATION_REQUIRED', `Configure ${name}.`, 503)
  let url: URL
  try { url = new URL(value) } catch { throw new PluginError('CONFIGURATION_REQUIRED', `${name} invalido.`, 503) }
  if (url.username || url.password || url.search || url.hash
    || (url.protocol !== 'https:' && !(local && process.env.NODE_ENV !== 'production'
      && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new PluginError('CONFIGURATION_REQUIRED', `${name} deve usar HTTPS sem credenciais ou parametros.`, 503)
  }
  return url
}
export function getPluginConfig(): PluginConfig {
  const base = serviceUrl(process.env.CHATGPTPLUGIN_BASE_URL, 'CHATGPTPLUGIN_BASE_URL', true)
  const issuer = serviceUrl(process.env.CHATGPTPLUGIN_OAUTH_ISSUER, 'CHATGPTPLUGIN_OAUTH_ISSUER')
  if (base.pathname !== '/' || issuer.pathname !== '/') {
    throw new PluginError('CONFIGURATION_REQUIRED', 'Configure URLs de origem, sem caminhos.', 503)
  }
  const clientIds = (process.env.CHATGPTPLUGIN_OAUTH_CLIENT_IDS || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!clientIds.length) throw new PluginError('CONFIGURATION_REQUIRED', 'Configure os clientes OAuth autorizados.', 503)
  return {
    resource: `${base.origin}/api/mcp`, issuer: issuer.origin,
    metadataUrl: `${base.origin}/.well-known/oauth-protected-resource/api/mcp`,
    scope: 'erp:read', clientIds,
    origins: [base.origin, 'https://chatgpt.com', ...(process.env.CHATGPTPLUGIN_ALLOWED_ORIGINS || '')
      .split(',').filter(Boolean).map(v => serviceUrl(v.trim(), 'CHATGPTPLUGIN_ALLOWED_ORIGINS', true).origin)],
    toolTimeoutMs: 15000, requestsPerMinute: 60, nativeFormKey:process.env.CHATGPTPLUGIN_FORM_STATE_KEY,
  }
}
