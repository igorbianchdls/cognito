import { PluginError } from './contracts'

// Cada produto de chat (ChatGPT, Claude) monta a sua configuração; o núcleo só conhece o formato.
export type PluginIntegration = 'chatgpt' | 'claude'
export type PluginConfig = {
  /** Separa rascunhos, auditoria, limites e preferências de cada chat no schema plugin. */
  integration: PluginIntegration
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
export function serviceUrl(value: string | undefined, name: string, local = false): URL {
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
