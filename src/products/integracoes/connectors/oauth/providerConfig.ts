import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import type { IntegrationProviderOAuthReadiness } from '@/products/integracoes/shared/providers/providerTypes'

export type OAuthTokenAuthMethod = 'client_secret_post' | 'client_secret_basic'

export type OAuthProviderConfig = {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  redirectUri: string
  scopes: string
  tokenAuthMethod: OAuthTokenAuthMethod
}

export function getOAuthEnvName(provider: string, suffix: string) {
  return `INTEGRATIONS_OAUTH_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_${suffix}`
}

export function normalizeProviderForSecret(provider: string) {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function getOAuthProviderSecretRef(provider: string, suffix: string) {
  const config = getIntegrationsCloudConfig()
  const providerPart = normalizeProviderForSecret(provider)
  return `projects/${config.projectId}/secrets/${config.secrets.prefix}-oauth-${providerPart}-${suffix}`
}

async function envOrSecret(provider: string, envSuffix: string, secretSuffix: string): Promise<string> {
  const envValue = process.env[getOAuthEnvName(provider, envSuffix)]?.trim()
  if (envValue) return envValue
  return (await readSecret(getOAuthProviderSecretRef(provider, secretSuffix)))?.trim() || ''
}

export function normalizeTokenAuthMethod(provider: string, value: string): OAuthTokenAuthMethod {
  const method = value.trim().toLowerCase()
  if (method === 'basic' || method === 'client_secret_basic') return 'client_secret_basic'
  if (method === 'post' || method === 'body' || method === 'client_secret_post') return 'client_secret_post'

  return normalizeProviderForSecret(provider) === 'conta-azul'
    ? 'client_secret_basic'
    : 'client_secret_post'
}

export async function getOAuthProviderConfig(provider: string): Promise<OAuthProviderConfig> {
  const tokenAuthMethod = await envOrSecret(provider, 'TOKEN_AUTH_METHOD', 'token-auth-method')

  return {
    clientId: await envOrSecret(provider, 'CLIENT_ID', 'client-id'),
    clientSecret: await envOrSecret(provider, 'CLIENT_SECRET', 'client-secret'),
    authorizeUrl: await envOrSecret(provider, 'AUTHORIZE_URL', 'authorize-url'),
    tokenUrl: await envOrSecret(provider, 'TOKEN_URL', 'token-url'),
    redirectUri: process.env[getOAuthEnvName(provider, 'REDIRECT_URI')]?.trim()
      || process.env.INTEGRATIONS_OAUTH_REDIRECT_URI?.trim()
      || '',
    scopes: await envOrSecret(provider, 'SCOPES', 'scopes'),
    tokenAuthMethod: normalizeTokenAuthMethod(provider, tokenAuthMethod),
  }
}

export async function getOAuthProviderReadiness(provider: string): Promise<IntegrationProviderOAuthReadiness> {
  const config = await getOAuthProviderConfig(provider)
  const missing = [
    ['clientId', config.clientId],
    ['clientSecret', config.clientSecret],
    ['authorizeUrl', config.authorizeUrl],
    ['tokenUrl', config.tokenUrl],
    ['redirectUri', config.redirectUri],
  ].filter(([, value]) => !value).map(([key]) => key)
  const ready = missing.length === 0

  return {
    ready,
    configured: ready,
    missing,
    message: ready
      ? 'OAuth configurado.'
      : `OAuth em configuracao: faltam ${missing.join(', ')}.`,
  }
}

export function createOAuthBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`
}
