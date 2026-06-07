import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const ANALYTICS_RESOURCES: IntegrationResource[] = [
  {
    slug: 'accounts',
    name: 'Contas',
    description: 'Contas, propriedades, sites ou perfis conectados.',
    defaultEnabled: true,
  },
  {
    slug: 'locations',
    name: 'Locais',
    description: 'Unidades, lojas ou perfis locais quando disponiveis.',
    defaultEnabled: true,
  },
  {
    slug: 'traffic_daily',
    name: 'Trafego diario',
    description: 'Metricas diarias de usuarios, sessoes, cliques, impressoes e buscas.',
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
  {
    slug: 'reviews',
    name: 'Avaliacoes',
    description: 'Reviews, notas e respostas de perfis locais.',
    defaultEnabled: false,
  },
  {
    slug: 'local_posts',
    name: 'Posts locais',
    description: 'Postagens publicadas em perfis locais.',
    defaultEnabled: false,
  },
]

const GA4_RESOURCES = ANALYTICS_RESOURCES.filter((resource) => (
  ['accounts', 'traffic_daily', 'pages_daily', 'events_daily'].includes(resource.slug)
))

const SEARCH_CONSOLE_RESOURCES = ANALYTICS_RESOURCES.filter((resource) => (
  ['accounts', 'traffic_daily', 'pages_daily', 'queries_daily'].includes(resource.slug)
))

const GOOGLE_BUSINESS_RESOURCES = ANALYTICS_RESOURCES.filter((resource) => (
  ['accounts', 'locations', 'traffic_daily', 'reviews', 'local_posts'].includes(resource.slug)
))

function analyticsProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'analytics',
    resources: provider.resources || ANALYTICS_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['analytics', ...(provider.tags || [])],
  }
}

export const ANALYTICS_PROVIDERS: IntegrationProvider[] = [
  analyticsProvider({
    slug: 'google_analytics_4',
    toolkitSlug: 'GOOGLE_ANALYTICS_4',
    name: 'Google Analytics',
    description: 'Trafego, paginas, eventos e conversoes de propriedades GA4.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    resources: GA4_RESOURCES,
    tags: ['google', 'web-analytics'],
  }),
  analyticsProvider({
    slug: 'google_my_business',
    toolkitSlug: 'GOOGLE_MY_BUSINESS',
    name: 'Google My Business',
    description: 'Perfis locais do Google com locais, avaliacoes, posts e metricas de performance.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    resources: GOOGLE_BUSINESS_RESOURCES,
    tags: ['google', 'local', 'business-profile'],
  }),
  analyticsProvider({
    slug: 'google_search_console',
    toolkitSlug: 'GOOGLE_SEARCH_CONSOLE',
    name: 'Google Search Console',
    description: 'Performance organica de busca, consultas, paginas, paises e dispositivos.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    resources: SEARCH_CONSOLE_RESOURCES,
    tags: ['google', 'seo'],
  }),
]

export default ANALYTICS_PROVIDERS
