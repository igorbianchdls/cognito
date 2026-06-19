import { writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  createIntegrationEvent,
  updateConnectionSecret,
  updateConnectionStatus,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { refreshOAuthToken } from '@/products/integracoes/connectors/oauth/oauth'

export type ParsedCredentials = Record<string, unknown> | string | null

type RefreshOAuthCredentialsInput = {
  tenantId: number
  connectionId: string
  provider: string
  credentials: ParsedCredentials
  refreshWindowMs?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getString(credentials: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = credentials[key]
    if (nonEmptyString(value)) return value.trim()
  }
  return undefined
}

function shouldRefresh(credentials: Record<string, unknown>, refreshWindowMs: number) {
  const refreshToken = getString(credentials, 'refreshToken', 'refresh_token')
  if (!refreshToken) return false

  const expiresAtValue = getString(credentials, 'expiresAt', 'expires_at')
  if (!expiresAtValue) return false

  const expiresAt = Date.parse(expiresAtValue)
  if (!Number.isFinite(expiresAt)) return false

  return expiresAt - Date.now() <= refreshWindowMs
}

function mergeTokenSet(credentials: Record<string, unknown>, refreshed: {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}) {
  const refreshToken = refreshed.refreshToken || getString(credentials, 'refreshToken', 'refresh_token')
  return {
    ...credentials,
    authType: credentials.authType || credentials.auth_type || 'oauth2',
    accessToken: refreshed.accessToken,
    refreshToken,
    expiresAt: refreshed.expiresAt || credentials.expiresAt || credentials.expires_at,
    tokenType: refreshed.tokenType || credentials.tokenType || credentials.token_type,
    scope: refreshed.scope || credentials.scope,
  }
}

export async function refreshOAuthCredentialsIfNeeded(input: RefreshOAuthCredentialsInput): Promise<ParsedCredentials> {
  if (!isRecord(input.credentials)) return input.credentials

  const refreshWindowMs = input.refreshWindowMs
    ?? Number(process.env.INTEGRATIONS_OAUTH_REFRESH_WINDOW_MS || 10 * 60 * 1000)

  if (!shouldRefresh(input.credentials, refreshWindowMs)) return input.credentials

  const refreshToken = getString(input.credentials, 'refreshToken', 'refresh_token')
  if (!refreshToken) return input.credentials

  try {
    const refreshed = await refreshOAuthToken(input.provider, refreshToken)
    if (!refreshed?.accessToken) {
      throw new Error(`OAuth ${input.provider} nao retornou access token no refresh.`)
    }

    const merged = mergeTokenSet(input.credentials, refreshed)
    const secret = await writeConnectionCredentialsSecret({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      value: JSON.stringify(merged),
    })

    await updateConnectionSecret({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      secretRef: secret.secretRef,
      status: 'connected',
      metadata: {
        oauthRefreshedAt: new Date().toISOString(),
        oauthRefreshError: null,
        oauthRefreshFailedAt: null,
        tokenExpiresAt: merged.expiresAt || null,
      },
    })

    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      eventType: 'connection.oauth.refreshed',
      actor: 'integrations-worker',
      message: 'Token OAuth renovado antes do sync.',
      metadata: {
        provider: input.provider,
        tokenExpiresAt: merged.expiresAt || null,
      },
    })

    return merged
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao renovar token OAuth.'
    await updateConnectionStatus({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      status: 'pending_auth',
      metadata: {
        oauthRefreshFailedAt: new Date().toISOString(),
        oauthRefreshError: errorMessage,
      },
    })
    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      eventType: 'connection.oauth.refresh_failed',
      severity: 'error',
      actor: 'integrations-worker',
      message: 'Falha ao renovar token OAuth. Reautenticacao necessaria.',
      metadata: {
        provider: input.provider,
        errorMessage,
      },
    })
    throw new Error(errorMessage)
  }
}
