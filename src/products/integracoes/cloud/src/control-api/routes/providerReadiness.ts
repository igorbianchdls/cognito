import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { getOAuthProviderReadiness } from '@/products/integracoes/connectors/oauth'
import { listIntegrationProviders } from '@/products/integracoes/shared/providers/providerCatalog'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseProviders(body: unknown): string[] {
  if (!isRecord(body) || !Array.isArray(body.providers)) return []
  return body.providers
    .map((provider) => String(provider || '').trim())
    .filter(Boolean)
}

export async function handleProviderOAuthReadiness(request: ControlApiRequest): Promise<ControlApiResponse> {
  const requestedProviders = new Set(parseProviders(request.body))
  const providers = listIntegrationProviders()
    .filter((provider) => provider.authType === 'oauth2')
    .filter((provider) => requestedProviders.size === 0 || requestedProviders.has(provider.slug))

  const entries = await Promise.all(providers.map(async (provider) => {
    try {
      return [provider.slug, await getOAuthProviderReadiness(provider.slug)] as const
    } catch (error) {
      return [provider.slug, {
        ready: false,
        configured: false,
        missing: ['oauth_config'],
        message: error instanceof Error ? error.message : 'Falha ao verificar OAuth.',
      }] as const
    }
  }))

  return {
    status: 200,
    body: {
      ok: true,
      providers: Object.fromEntries(entries),
    },
  }
}
