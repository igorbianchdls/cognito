import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import {
  getOAuthProviderConfig,
  getOAuthProviderReadiness,
} from '@/products/integracoes/connectors/oauth/providerConfig'
import {
  exchangeOAuthCode,
  refreshOAuthToken,
  type OAuthTokenSet,
} from '@/products/integracoes/connectors/oauth/tokenExchange'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'

export type { OAuthTokenSet }
export { exchangeOAuthCode, getOAuthProviderReadiness, refreshOAuthToken }

export type OAuthStatePayload = {
  tenantId: number
  connectionId: string
  provider: string
  nonce: string
  expiresAt: number
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function getStateSecret() {
  return process.env.INTEGRATIONS_OAUTH_STATE_SECRET
    || process.env.INTEGRATIONS_INTERNAL_API_KEY
    || getIntegrationsCloudConfig().secrets.internalApiKey
}

function sign(value: string) {
  return createHmac('sha256', getStateSecret()).update(value).digest('base64url')
}

function verifySignature(value: string, signature: string) {
  const expected = Buffer.from(sign(value))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function createOAuthState(input: {
  tenantId: number
  connectionId: string
  provider: string
  ttlSeconds?: number
}) {
  const payload: OAuthStatePayload = {
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    provider: input.provider,
    nonce: randomBytes(12).toString('base64url'),
    expiresAt: Date.now() + (input.ttlSeconds || 900) * 1000,
  }
  const encoded = base64UrlEncode(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function parseOAuthState(state: string): OAuthStatePayload {
  const [encoded, signature] = state.split('.')
  if (!encoded || !signature || !verifySignature(encoded, signature)) {
    throw new Error('OAuth state invalido.')
  }

  const payload = JSON.parse(base64UrlDecode(encoded)) as OAuthStatePayload
  if (!payload.expiresAt || payload.expiresAt < Date.now()) {
    throw new Error('OAuth state expirado.')
  }
  return payload
}

export async function buildOAuthAuthorizationUrl(provider: string, state: string): Promise<{
  ready: boolean
  authorizationUrl?: string
  missing?: string[]
}> {
  const config = await getOAuthProviderConfig(provider)
  const missing = [
    ['clientId', config.clientId],
    ['authorizeUrl', config.authorizeUrl],
    ['redirectUri', config.redirectUri],
  ].filter(([, value]) => !value).map(([key]) => key)

  if (missing.length) return { ready: false, missing }

  const url = new URL(config.authorizeUrl)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  if (config.scopes) url.searchParams.set('scope', config.scopes)

  return {
    ready: true,
    authorizationUrl: url.toString(),
  }
}
