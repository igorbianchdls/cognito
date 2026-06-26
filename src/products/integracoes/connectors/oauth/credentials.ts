import { randomUUID } from 'node:crypto'

import { readSecret, writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  acquireConnectionOAuthRefreshLock,
  createIntegrationEvent,
  getCloudIntegrationConnection,
  releaseConnectionOAuthRefreshLock,
  updateConnectionSecret,
  updateConnectionStatus,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { refreshOAuthToken } from '@/products/integracoes/connectors/oauth/oauth'
import {
  createIntegrationRuntimeError,
  integrationErrorInfoFromUnknown,
  isProviderReauthError,
} from '@/products/integracoes/shared/integrationErrors'

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

function parseCredentials(value: string | null): ParsedCredentials {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : value
  } catch {
    return value
  }
}

export async function refreshOAuthCredentialsIfNeeded(input: RefreshOAuthCredentialsInput): Promise<ParsedCredentials> {
  if (!isRecord(input.credentials)) return input.credentials

  const refreshWindowMs = input.refreshWindowMs
    ?? Number(process.env.INTEGRATIONS_OAUTH_REFRESH_WINDOW_MS || 10 * 60 * 1000)

  if (!shouldRefresh(input.credentials, refreshWindowMs)) return input.credentials

  const refreshToken = getString(input.credentials, 'refreshToken', 'refresh_token')
  if (!refreshToken) return input.credentials
  const lockToken = randomUUID()
  const lockAcquired = await acquireConnectionOAuthRefreshLock({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    lockToken,
    owner: `oauth-refresh:${input.provider}`,
  })

  if (!lockAcquired) {
    const connection = await getCloudIntegrationConnection({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
    })
    const currentCredentials = parseCredentials(connection?.secretRef
      ? await readSecret(connection.secretRef).catch(() => null)
      : null)
    if (isRecord(currentCredentials) && !shouldRefresh(currentCredentials, refreshWindowMs)) return currentCredentials
    throw createIntegrationRuntimeError({
      source: 'internal',
      operation: 'oauth_refresh_lock',
      code: 'refresh_lock_busy',
      safeMessage: `Refresh OAuth ${input.provider} ja esta em andamento para esta conexao.`,
      retryable: true,
    })
  }

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
        lastAuthErrorSource: null,
        lastAuthErrorCode: null,
        lastAuthErrorMessage: null,
        tokenExpiresAt: merged.expiresAt || null,
      },
    })
    await releaseConnectionOAuthRefreshLock({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      lockToken,
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
    const info = integrationErrorInfoFromUnknown(error)
    const connection = await getCloudIntegrationConnection({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
    }).catch(() => null)
    const currentCredentials = parseCredentials(connection?.secretRef
      ? await readSecret(connection.secretRef).catch(() => null)
      : null)
    if (isRecord(currentCredentials) && !shouldRefresh(currentCredentials, refreshWindowMs)) {
      await releaseConnectionOAuthRefreshLock({
        tenantId: input.tenantId,
        connectionId: input.connectionId,
        lockToken,
      }).catch(() => {})
      return currentCredentials
    }

    const requiresReauth = isProviderReauthError(error)
    await updateConnectionStatus({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      status: requiresReauth ? 'pending_auth' : (connection?.status || 'warning'),
      metadata: requiresReauth
        ? {
            oauthRefreshFailedAt: new Date().toISOString(),
            oauthRefreshError: info.safeMessage,
            lastAuthErrorSource: info.source,
            lastAuthErrorCode: info.code,
            lastAuthErrorMessage: info.safeMessage,
            lastAuthErrorHttpStatus: info.httpStatus || null,
            lastAuthErrorRaw: info.rawErrorRedacted || null,
          }
        : {
            lastInfraErrorAt: new Date().toISOString(),
            lastInfraErrorSource: info.source,
            lastInfraErrorCode: info.code,
            lastInfraErrorMessage: info.safeMessage,
            lastInfraErrorHttpStatus: info.httpStatus || null,
            lastInfraErrorRaw: info.rawErrorRedacted || null,
          },
    })
    await releaseConnectionOAuthRefreshLock({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      lockToken,
    }).catch(() => {})
    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      eventType: requiresReauth ? 'connection.oauth.refresh_failed' : 'system.note',
      severity: 'error',
      actor: 'integrations-worker',
      message: requiresReauth
        ? 'Falha OAuth do provider ao renovar token. Reautenticacao necessaria.'
        : 'Falha de infraestrutura ao renovar token OAuth. Reautenticacao nao confirmada.',
      metadata: {
        provider: input.provider,
        errorSource: info.source,
        errorCode: info.code,
        errorMessage: info.safeMessage,
        httpStatus: info.httpStatus || null,
        rawErrorRedacted: info.rawErrorRedacted || null,
      },
    })
    throw error
  }
}
