import {
  createOAuthBasicAuthHeader,
  getOAuthProviderConfig,
} from '@/products/integracoes/connectors/oauth/providerConfig'
import {
  createIntegrationRuntimeError,
  redactErrorPayload,
} from '@/products/integracoes/shared/integrationErrors'

export type OAuthTokenSet = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
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
  const config = await getOAuthProviderConfig(provider)
  if (!config.clientId || !config.clientSecret || !config.tokenUrl) {
    throw new Error(`OAuth ${provider} nao configurado.`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (config.tokenAuthMethod === 'client_secret_basic') {
    headers.Authorization = createOAuthBasicAuthHeader(config.clientId, config.clientSecret)
  } else {
    body.set('client_id', config.clientId)
    body.set('client_secret', config.clientSecret)
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(Number(process.env.INTEGRATIONS_OAUTH_TIMEOUT_MS || 30000)),
  })
  const payload = await response.json().catch(() => null) as TokenResponse | null
  if (!response.ok) {
    throw createIntegrationRuntimeError({
      source: 'provider_oauth',
      provider,
      operation: body.get('grant_type') || 'token',
      code: payload?.error || `http_${response.status}`,
      httpStatus: response.status,
      safeMessage: payload?.error_description || payload?.error || `Falha OAuth ${provider}: ${response.status}`,
      retryable: response.status >= 500 || response.status === 429,
      rawErrorRedacted: redactErrorPayload(payload),
    })
  }
  return payload ? mapTokenResponse(payload) : null
}

export async function exchangeOAuthCode(provider: string, code: string, redirectUri?: string): Promise<OAuthTokenSet | null> {
  const config = await getOAuthProviderConfig(provider)
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
