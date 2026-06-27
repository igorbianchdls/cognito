import {
  getIntegrationProvider,
  listIntegrationProviders,
} from '@/products/integracoes/shared/providers/providerCatalog'
import type { IntegrationDomain, IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

export class IntegrationProviderError extends Error {
  status: number
  code: string

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message)
    this.name = 'IntegrationProviderError'
    this.status = options?.status ?? 400
    this.code = options?.code ?? 'invalid_provider'
  }
}

export function requireIntegrationProvider(slug: string): IntegrationProvider {
  const provider = getIntegrationProvider(slug)
  if (!provider) {
    throw new IntegrationProviderError(`Provider de integracao invalido: ${slug || '(vazio)'}`, {
      status: 404,
      code: 'provider_not_found',
    })
  }

  return provider
}

export function listRegisteredIntegrationProviders(domain?: IntegrationDomain): IntegrationProvider[] {
  return listIntegrationProviders(domain)
}

export function getDefaultResourceSlugs(provider: IntegrationProvider): string[] {
  return provider.resources
    .filter((resource) => resource.defaultEnabled)
    .map((resource) => resource.slug)
}

const RESOURCE_ALIASES_BY_PROVIDER: Record<string, Record<string, string>> = {
  conta_azul: {
    'contas-a-pagar': 'contas_pagar',
    'contas-a-receber': 'contas_receber',
    'contas-financeiras': 'contas_financeiras',
    'centros-custo': 'centros_custo',
    'pedidos-venda': 'vendas',
    'categorias-dre': 'categorias_dre',
    'produto-categorias': 'produto_categorias',
    'produto-cest': 'produto_cest',
    'produto-ecommerce-marcas': 'produto_ecommerce_marcas',
    'produto-ncm': 'produto_ncm',
    'produto-unidades-medida': 'produto_unidades_medida',
  },
}

export function normalizeProviderResourceSlug(provider: IntegrationProvider, resource: string): string {
  const value = String(resource || '').trim()
  return RESOURCE_ALIASES_BY_PROVIDER[provider.slug]?.[value] || value
}

export function normalizeRequestedResources(provider: IntegrationProvider, resources?: string[]): string[] {
  const validResources = new Set(provider.resources.map((resource) => resource.slug))
  const requested = Array.isArray(resources) && resources.length
    ? resources
    : getDefaultResourceSlugs(provider)

  const normalized = requested
    .map((resource) => normalizeProviderResourceSlug(provider, resource))
    .filter((resource) => resource && validResources.has(resource))

  return Array.from(new Set(normalized))
}
