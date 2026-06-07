import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { exchangeOAuthCode, parseOAuthState } from '@/products/integracoes/cloud/src/oauth'
import { writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  createIntegrationEvent,
  updateConnectionSecret,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'

function getQueryString(request: ControlApiRequest, name: string) {
  const value = request.query?.[name]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value : undefined
}

export async function handleProviderCallback(request: ControlApiRequest): Promise<ControlApiResponse> {
  try {
    const code = getQueryString(request, 'code')
    const state = getQueryString(request, 'state')
    if (!code || !state) {
      return {
        status: 400,
        body: {
          ok: false,
          error: 'OAuth callback exige code e state.',
        },
      }
    }

    const parsedState = parseOAuthState(state)
    const tokenSet = await exchangeOAuthCode(parsedState.provider, code)
    if (!tokenSet) {
      return {
        status: 502,
        body: {
          ok: false,
          error: 'Provider OAuth nao retornou access token.',
        },
      }
    }

    const secret = await writeConnectionCredentialsSecret({
      tenantId: parsedState.tenantId,
      connectionId: parsedState.connectionId,
      value: JSON.stringify({
        authType: 'oauth2',
        ...tokenSet,
      }),
    })
    await updateConnectionSecret({
      tenantId: parsedState.tenantId,
      connectionId: parsedState.connectionId,
      secretRef: secret.secretRef,
      status: 'connected',
      metadata: {
        setupMode: 'gcp',
        authType: 'oauth2',
        provider: parsedState.provider,
        tokenStoredAt: new Date().toISOString(),
        tokenExpiresAt: tokenSet.expiresAt || null,
      },
    })
    await createIntegrationEvent({
      tenantId: parsedState.tenantId,
      connectionId: parsedState.connectionId,
      eventType: 'connection.oauth.connected',
      actor: 'integrations-control-api',
      message: 'OAuth conectado e tokens armazenados no Secret Manager.',
      metadata: {
        provider: parsedState.provider,
        tokenExpiresAt: tokenSet.expiresAt || null,
      },
    })

    return {
      status: 202,
      body: {
        ok: true,
        mode: 'gcp',
        status: 'connected',
        provider: parsedState.provider,
        message: 'OAuth conectado.',
      },
    }
  } catch (error) {
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha no callback OAuth.',
      },
    }
  }
}
