import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { validateProviderCredentials } from '@/products/integracoes/cloud/src/lib/credentials'
import { buildOAuthAuthorizationUrl, createOAuthState } from '@/products/integracoes/cloud/src/oauth'
import { writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { getCloudConnector } from '@/products/integracoes/connectors/registry/providerRegistry'
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
    if (body.credentials != null) {
      const validation = validateProviderCredentials(provider, body.credentials)
      if (!validation.ok || !validation.serialized) {
        return {
          status: 400,
          body: {
            ok: false,
            error: validation.error || 'Credenciais invalidas.',
          },
        }
      }

      const connector = getCloudConnector(provider.slug)
      if (connector) {
        try {
          const test = await connector.testConnection({
            tenantId: body.tenantId,
            connectionId: body.connectionId,
            provider: provider.slug,
            credentials: validation.normalized || JSON.parse(validation.serialized),
            selectedResources: body.resources || [],
          })
          if (test.status === 'error') {
            return {
              status: 400,
              body: {
                ok: false,
                error: test.errorMessage || 'Credenciais recusadas pelo provider.',
              },
            }
          }
        } catch (error) {
          return {
            status: 400,
            body: {
              ok: false,
              error: error instanceof Error ? error.message : 'Falha ao validar credenciais no provider.',
            },
          }
        }
      }

      const secret = await writeConnectionCredentialsSecret({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        value: validation.serialized,
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

    if (provider.authType === 'oauth2') {
      const state = createOAuthState({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        provider: provider.slug,
      })
      const authorization = await buildOAuthAuthorizationUrl(provider.slug, state)
      await updateConnectionStatus({
        tenantId: body.tenantId,
        connectionId: body.connectionId,
        status: 'pending_auth',
        metadata: {
          setupMode: 'gcp',
          authType: provider.authType,
          oauthRequired: true,
          reconnect: body.reconnect === true,
          oauthStateCreatedAt: new Date().toISOString(),
        },
      })

      return {
        status: 202,
        body: {
          ok: true,
          mode: 'gcp',
          status: 'pending_auth',
          authType: provider.authType,
          authorizationUrl: authorization.authorizationUrl,
          message: authorization.ready
            ? 'Conexao aguardando autorizacao OAuth.'
            : 'OAuth ainda precisa de configuracao do provider no Secret Manager.',
        },
      }
    }

    await updateConnectionStatus({
      tenantId: body.tenantId,
      connectionId: body.connectionId,
      status: 'pending_auth',
      metadata: {
        setupMode: 'gcp',
        authType: provider.authType,
        credentialsRequired: true,
        oauthRequired: false,
        reconnect: body.reconnect === true,
      },
    })

    return {
      status: 202,
      body: {
        ok: true,
        mode: 'gcp',
        status: 'pending_auth',
        authType: provider.authType,
        message: 'Conexao aguardando credenciais para gravar no Secret Manager.',
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
