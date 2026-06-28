import { readSecret, writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  createIntegrationEvent,
  getCloudIntegrationConnection,
  updateConnectionSecret,
  updateConnectionStatus,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'

export type ParsedCredentials = Record<string, unknown> | string | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseOAuthCredentials(value: string | null): ParsedCredentials {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : value
  } catch {
    return value
  }
}

export async function readConnectionOAuthCredentials(secretRef?: string | null) {
  return parseOAuthCredentials(secretRef ? await readSecret(secretRef).catch(() => null) : null)
}

export async function rereadConnectionOAuthCredentials(input: {
  tenantId: number
  connectionId: string
}) {
  const connection = await getCloudIntegrationConnection({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
  }).catch(() => null)
  return readConnectionOAuthCredentials(connection?.secretRef)
}

export async function persistConnectionOAuthCredentials(input: {
  tenantId: number
  connectionId: string
  provider: string
  credentials: Record<string, unknown>
  actor?: string
}) {
  const secret = await writeConnectionCredentialsSecret({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    value: JSON.stringify(input.credentials),
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
      tokenExpiresAt: input.credentials.expiresAt || input.credentials.expires_at || null,
    },
  })

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: 'connection.oauth.refreshed',
    actor: input.actor || 'integrations-worker',
    message: 'Token OAuth renovado e persistido.',
    metadata: {
      provider: input.provider,
      tokenExpiresAt: input.credentials.expiresAt || input.credentials.expires_at || null,
      persisted: true,
    },
  })

  return secret
}

export async function markConnectionOAuthRefreshFailure(input: {
  tenantId: number
  connectionId: string
  provider: string
  status: 'pending_auth' | 'warning'
  metadata: Record<string, unknown>
  eventType: 'connection.oauth.refresh_failed' | 'system.note'
  eventMessage: string
}) {
  await updateConnectionStatus({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    status: input.status,
    metadata: input.metadata,
  })
  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: input.eventType,
    severity: 'error',
    actor: 'integrations-worker',
    message: input.eventMessage,
    metadata: {
      provider: input.provider,
      ...input.metadata,
    },
  })
}
