import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  createIntegrationEvent,
  updateConnectionSecret,
  updateConnectionStatus,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { requireIntegrationProvider } from '@/products/integracoes/server/integrationProviderRegistry'

type ConnectionSetupBody = {
  tenantId?: number
  connectionId?: string
  provider?: string
  credentials?: unknown
  reconnect?: boolean
  resources?: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseBody(body: unknown): ConnectionSetupBody {
  if (!isRecord(body)) return {}
  return {
    tenantId: typeof body.tenantId === 'number' ? body.tenantId : undefined,
    connectionId: typeof body.connectionId === 'string' ? body.connectionId : undefined,
    provider: typeof body.provider === 'string' ? body.provider : undefined,
    credentials: body.credentials,
    reconnect: body.reconnect === true,
    resources: Array.isArray(body.resources)
      ? body.resources.filter((resource): resource is string => typeof resource === 'string')
      : undefined,
  }
}

function serializeCredentials(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (isRecord(value)) return JSON.stringify(value)
  return null
}

export async function handleConnectionSetup(request: ControlApiRequest): Promise<ControlApiResponse> {
  try {
    const body = parseBody(request.body)
    if (!body.tenantId || !body.connectionId || !body.provider) {
      return {
        status: 400,
        body: {
          ok: false,
          error: 'tenantId, connectionId e provider sao obrigatorios.',
        },
      }
    }

    const provider = requireIntegrationProvider(body.provider)
    const serializedCredentials = serializeCredentials(body.credentials)
    if (serializedCredentials) {
      const secret = await writeConnectionCredentialsSecret({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        value: serializedCredentials,
      })
      await updateConnectionSecret({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        secretRef: secret.secretRef,
        status: 'connected',
        metadata: {
          setupMode: 'gcp',
          authType: provider.authType,
          credentialsStoredAt: new Date().toISOString(),
          reconnect: body.reconnect === true,
        },
      })
      await createIntegrationEvent({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        eventType: 'connection.updated',
        actor: 'integrations-control-api',
        message: 'Credenciais armazenadas no Secret Manager.',
        metadata: {
          provider: provider.slug,
          authType: provider.authType,
          secretRef: secret.secretRef,
        },
      })

      return {
        status: 202,
        body: {
          ok: true,
          mode: 'gcp',
          status: 'connected',
          secretRef: secret.secretRef,
          message: 'Credenciais armazenadas no Secret Manager e conexao marcada como conectada.',
        },
      }
    }

    const nextStatus = provider.authType === 'oauth2' ? 'pending_auth' : 'pending_auth'
    await updateConnectionStatus({
      tenantId: body.tenantId,
      connectionId: body.connectionId,
      status: nextStatus,
      metadata: {
        setupMode: 'gcp',
        authType: provider.authType,
        credentialsRequired: provider.authType !== 'oauth2',
        oauthRequired: provider.authType === 'oauth2',
        reconnect: body.reconnect === true,
      },
    })

    return {
      status: 202,
      body: {
        ok: true,
        mode: 'gcp',
        status: nextStatus,
        authType: provider.authType,
        message: provider.authType === 'oauth2'
          ? 'Conexao aguardando OAuth. Callback generico entra na proxima entrega.'
          : 'Conexao aguardando credenciais para gravar no Secret Manager.',
      },
    }
  } catch (error) {
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha no setup cloud da conexao.',
      },
    }
  }
}
