import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { getIntegrationsCloudConfig } from '@/products/integracoes/cloud/src/config/gcpConfig'

export type OAuthTokenSet = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

export type OAuthStatePayload = {
  tenantId: number
  connectionId: string
  provider: string
  nonce: string
  expiresAt: number
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
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

function envName(provider: string, suffix: string) {
  return `INTEGRATIONS_OAUTH_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_${suffix}`
}

function getOAuthProviderConfig(provider: string) {
  return {
    clientId: process.env[envName(provider, 'CLIENT_ID')]?.trim() || '',
    clientSecret: process.env[envName(provider, 'CLIENT_SECRET')]?.trim() || '',
    authorizeUrl: process.env[envName(provider, 'AUTHORIZE_URL')]?.trim() || '',
    tokenUrl: process.env[envName(provider, 'TOKEN_URL')]?.trim() || '',
    redirectUri: process.env[envName(provider, 'REDIRECT_URI')]?.trim() || process.env.INTEGRATIONS_OAUTH_REDIRECT_URI?.trim() || '',
    scopes: process.env[envName(provider, 'SCOPES')]?.trim() || '',
  }
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

export function buildOAuthAuthorizationUrl(provider: string, state: string): {
  ready: boolean
  authorizationUrl?: string
  missing?: string[]
} {
  const config = getOAuthProviderConfig(provider)
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

function mapTokenResponse(payload: TokenResponse): OAuthTokenSet | null {
  if (!payload.access_token) return null
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : undefined,
    tokenType: payload.token_type,
    scope: payload.scope,
  }
}

async function postTokenRequest(provider: string, body: URLSearchParams): Promise<OAuthTokenSet | null> {
  const config = getOAuthProviderConfig(provider)
  if (!config.clientId || !config.clientSecret || !config.tokenUrl) {
    throw new Error(`OAuth ${provider} nao configurado.`)
  }

  body.set('client_id', config.clientId)
  body.set('client_secret', config.clientSecret)
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(Number(process.env.INTEGRATIONS_OAUTH_TIMEOUT_MS || 30000)),
  })
  const payload = await response.json().catch(() => null) as TokenResponse | null
  if (!response.ok) {
    throw new Error(`Falha OAuth ${provider}: ${response.status}`)
  }
  return payload ? mapTokenResponse(payload) : null
}

export async function exchangeOAuthCode(provider: string, code: string, redirectUri?: string): Promise<OAuthTokenSet | null> {
  const config = getOAuthProviderConfig(provider)
  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', redirectUri || config.redirectUri)
  return postTokenRequest(provider, body)
}

export async function refreshOAuthToken(provider: string, refreshToken: string): Promise<OAuthTokenSet | null> {
  const body = new URLSearchParams()
  body.set('grant_type', 'refresh_token')
  body.set('refresh_token', refreshToken)
  return postTokenRequest(provider, body)
}
