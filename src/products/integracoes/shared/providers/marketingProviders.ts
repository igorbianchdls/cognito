import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const ORGANIC_MARKETING_RESOURCES: IntegrationResource[] = [
  {
    slug: 'accounts',
    name: 'Contas',
    description: 'Contas, propriedades, sites ou perfis conectados.',
    defaultEnabled: true,
  },
  {
    slug: 'traffic_daily',
    name: 'Trafego diario',
    description: 'Metricas diarias de usuarios, sessoes, cliques e impressoes.',
    defaultEnabled: true,
  },
  {
    slug: 'pages_daily',
    name: 'Paginas diarias',
    description: 'Desempenho diario por pagina, URL ou landing page.',
    defaultEnabled: true,
  },
  {
    slug: 'queries_daily',
    name: 'Consultas diarias',
    description: 'Consultas, termos de busca e performance organica.',
    defaultEnabled: false,
  },
  {
    slug: 'events_daily',
    name: 'Eventos diarios',
    description: 'Eventos, conversoes e interacoes por dia.',
    defaultEnabled: false,
  },
]

function marketingProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'marketing',
    resources: provider.resources || ORGANIC_MARKETING_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['marketing', 'organico', ...(provider.tags || [])],
  }
}

export const MARKETING_PROVIDERS: IntegrationProvider[] = [
  marketingProvider({
    slug: 'google_search_console',
    toolkitSlug: 'GOOGLE_SEARCH_CONSOLE',
    name: 'Google Search Console',
    description: 'Performance organica de busca, consultas, paginas, paises e dispositivos.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['seo', 'google'],
  }),
  marketingProvider({
    slug: 'google_analytics_4',
    toolkitSlug: 'GOOGLE_ANALYTICS_4',
    name: 'Google Analytics 4',
    description: 'Trafego, paginas, eventos e conversoes de propriedades GA4.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['analytics', 'google'],
  }),
]

export default MARKETING_PROVIDERS
