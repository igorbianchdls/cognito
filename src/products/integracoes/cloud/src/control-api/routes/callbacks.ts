import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { exchangeOAuthCode, parseOAuthState } from '@/products/integracoes/connectors/oauth'
import { writeConnectionCredentialsSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import {
  createIntegrationEvent,
  getCloudIntegrationConnection,
  updateConnectionSecret,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { finalizeConnectedIntegration } from '@/products/integracoes/server/finalizeConnectedIntegration'

function getQueryString(request: ControlApiRequest, name: string) {
  const value = request.query?.[name]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value : undefined
}

function getAppCallbackUrl(params: {
  status: 'connected' | 'error'
  provider?: string
  connectionId?: string
  tenantId?: number
  error?: string
}) {
  const baseUrl = process.env.INTEGRATIONS_APP_CALLBACK_URL?.trim()
    || 'https://cognito-305346154546.southamerica-east1.run.app/integracoes/callback'
  const url = new URL(baseUrl)
  url.searchParams.set('status', params.status)
  if (params.provider) url.searchParams.set('provider', params.provider)
  if (params.connectionId) url.searchParams.set('connectionId', params.connectionId)
  if (params.tenantId) url.searchParams.set('tenantId', String(params.tenantId))
  if (params.error) url.searchParams.set('error', params.error)
  return url.toString()
}

function redirectToApp(url: string): ControlApiResponse {
  return {
    status: 302,
    headers: {
      Location: url,
    },
    body: {
      ok: true,
      redirectUrl: url,
    },
  }
}

export async function handleProviderCallback(request: ControlApiRequest): Promise<ControlApiResponse> {
  let callbackContext: {
    provider?: string
    connectionId?: string
    tenantId?: number
  } = {}

  try {
    const code = getQueryString(request, 'code')
    const state = getQueryString(request, 'state')
    if (!code || !state) {
      return redirectToApp(getAppCallbackUrl({
        status: 'error',
        error: 'OAuth callback exige code e state.',
      }))
    }

    const parsedState = parseOAuthState(state)
    callbackContext = {
      provider: parsedState.provider,
      connectionId: parsedState.connectionId,
      tenantId: parsedState.tenantId,
    }

    const tokenSet = await exchangeOAuthCode(parsedState.provider, code)
    if (!tokenSet) {
      return redirectToApp(getAppCallbackUrl({
        ...callbackContext,
        status: 'error',
        error: 'Provider OAuth nao retornou access token.',
      }))
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
        oauthRefreshError: null,
        oauthRefreshFailedAt: null,
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
    const connection = await getCloudIntegrationConnection({
      tenantId: parsedState.tenantId,
      connectionId: parsedState.connectionId,
    })
    if (connection) {
      await finalizeConnectedIntegration({
        tenantId: parsedState.tenantId,
        connectionId: parsedState.connectionId,
        displayName: connection.displayName,
        resources: connection.selectedResources,
        syncFrequency: connection.syncFrequency,
        requestedBy: 'oauth-callback',
      })
    }

    return redirectToApp(getAppCallbackUrl({
      ...callbackContext,
      status: 'connected',
    }))
  } catch (error) {
    return redirectToApp(getAppCallbackUrl({
      ...callbackContext,
      status: 'error',
      error: error instanceof Error ? error.message : 'Falha no callback OAuth.',
    }))
  }
}
