import { randomUUID } from 'node:crypto'

import {
  acquireConnectionOAuthRefreshLock,
  releaseConnectionOAuthRefreshLock,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import {
  markConnectionOAuthRefreshFailure,
  persistConnectionOAuthCredentials,
  rereadConnectionOAuthCredentials,
  type ParsedCredentials,
} from '@/products/integracoes/connectors/oauth/credentialStore'
import { refreshOAuthToken, type OAuthTokenSet } from '@/products/integracoes/connectors/oauth/tokenExchange'
import {
  createIntegrationRuntimeError,
  integrationErrorInfoFromUnknown,
  isProviderReauthError,
} from '@/products/integracoes/shared/integrationErrors'

export type { ParsedCredentials }

export type RefreshOAuthCredentialsInput = {
  tenantId: number
  connectionId: string
  provider: string
  credentials: ParsedCredentials
  refreshWindowMs?: number
  force?: boolean
  actor?: string
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

export function shouldRefreshOAuthCredentials(credentials: Record<string, unknown>, refreshWindowMs: number) {
  const refreshToken = getString(credentials, 'refreshToken', 'refresh_token')
  if (!refreshToken) return false

  const expiresAtValue = getString(credentials, 'expiresAt', 'expires_at')
  if (!expiresAtValue) return false

  const expiresAt = Date.parse(expiresAtValue)
  if (!Number.isFinite(expiresAt)) return false

  return expiresAt - Date.now() <= refreshWindowMs
}

export function mergeOAuthTokenSet(credentials: Record<string, unknown>, refreshed: OAuthTokenSet) {
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForConcurrentRefresh(input: {
  tenantId: number
  connectionId: string
  refreshWindowMs: number
}) {
  const waitMs = Math.max(0, Number(process.env.INTEGRATIONS_OAUTH_REFRESH_LOCK_WAIT_MS || 15000))
  const pollMs = Math.max(250, Number(process.env.INTEGRATIONS_OAUTH_REFRESH_LOCK_POLL_MS || 750))
  const startedAt = Date.now()

  while (Date.now() - startedAt <= waitMs) {
    const currentCredentials = await rereadConnectionOAuthCredentials({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
    })
    if (isRecord(currentCredentials) && !shouldRefreshOAuthCredentials(currentCredentials, input.refreshWindowMs)) {
      return currentCredentials
    }
    await sleep(pollMs)
  }

  throw createIntegrationRuntimeError({
    source: 'internal',
    operation: 'oauth_refresh_lock',
    code: 'refresh_lock_busy',
    safeMessage: 'Refresh OAuth ja esta em andamento para esta conexao. Tente novamente em alguns segundos.',
    retryable: true,
  })
}

export async function refreshAndPersistOAuthCredentials(input: RefreshOAuthCredentialsInput): Promise<ParsedCredentials> {
  if (!isRecord(input.credentials)) return input.credentials

  const refreshToken = getString(input.credentials, 'refreshToken', 'refresh_token')
  if (!refreshToken) return input.credentials

  const refreshWindowMs = input.refreshWindowMs
    ?? Number(process.env.INTEGRATIONS_OAUTH_REFRESH_WINDOW_MS || 10 * 60 * 1000)

  if (!input.force && !shouldRefreshOAuthCredentials(input.credentials, refreshWindowMs)) {
    return input.credentials
  }

  const lockToken = randomUUID()
  const lockAcquired = await acquireConnectionOAuthRefreshLock({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    lockToken,
    owner: `oauth-refresh:${input.provider}`,
  })

  if (!lockAcquired) {
    return waitForConcurrentRefresh({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      refreshWindowMs,
    })
  }

  try {
    const refreshed = await refreshOAuthToken(input.provider, refreshToken)
    if (!refreshed?.accessToken) {
      throw new Error(`OAuth ${input.provider} nao retornou access token no refresh.`)
    }

    const merged = mergeOAuthTokenSet(input.credentials, refreshed)
    await persistConnectionOAuthCredentials({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      provider: input.provider,
      credentials: merged,
      actor: input.actor,
    })

    await releaseConnectionOAuthRefreshLock({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      lockToken,
    })

    return merged
  } catch (error) {
    const info = integrationErrorInfoFromUnknown(error)
    const currentCredentials = await rereadConnectionOAuthCredentials({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
    })
    if (isRecord(currentCredentials) && !shouldRefreshOAuthCredentials(currentCredentials, refreshWindowMs)) {
      await releaseConnectionOAuthRefreshLock({
        tenantId: input.tenantId,
        connectionId: input.connectionId,
        lockToken,
      }).catch(() => {})
      return currentCredentials
    }

    const requiresReauth = isProviderReauthError(error)
    await markConnectionOAuthRefreshFailure({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      provider: input.provider,
      status: requiresReauth ? 'pending_auth' : 'warning',
      eventType: requiresReauth ? 'connection.oauth.refresh_failed' : 'system.note',
      eventMessage: requiresReauth
        ? 'Refresh token recusado pelo provider. Reautenticacao necessaria.'
        : 'Falha de infraestrutura ao renovar token OAuth. Reautenticacao nao confirmada.',
      metadata: requiresReauth
        ? {
            oauthRefreshFailedAt: new Date().toISOString(),
            oauthRefreshError: info.safeMessage,
            lastAuthErrorSource: info.source,
            lastAuthErrorCode: info.code,
            lastAuthErrorMessage: `${info.safeMessage}. Possivel causa: refresh token rotativo usado sem persistencia.`,
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
    throw error
  }
}

export async function refreshOAuthCredentialsIfNeeded(input: RefreshOAuthCredentialsInput): Promise<ParsedCredentials> {
  return refreshAndPersistOAuthCredentials({ ...input, force: false })
}
