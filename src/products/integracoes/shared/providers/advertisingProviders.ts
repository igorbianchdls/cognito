import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const ADVERTISING_RESOURCES: IntegrationResource[] = [
  {
    slug: 'accounts',
    name: 'Contas de anuncio',
    description: 'Contas, customers ou ad accounts disponiveis.',
    defaultEnabled: true,
  },
  {
    slug: 'campaigns',
    name: 'Campanhas',
    description: 'Campanhas, status, orcamentos e objetivos.',
    defaultEnabled: true,
  },
  {
    slug: 'ad_groups',
    name: 'Grupos de anuncios',
    description: 'Conjuntos, grupos, segmentacoes e status.',
    defaultEnabled: true,
  },
  {
    slug: 'ads',
    name: 'Anuncios',
    description: 'Anuncios, criativos, status e relacionamento com campanha.',
    defaultEnabled: true,
  },
  {
    slug: 'insights_campaign_daily',
    name: 'Metricas por campanha',
    description: 'Gasto, impressoes, cliques e conversoes por campanha e dia.',
    defaultEnabled: true,
  },
  {
    slug: 'insights_ad_daily',
    name: 'Metricas por anuncio',
    description: 'Gasto, impressoes, cliques e conversoes por anuncio e dia.',
    defaultEnabled: false,
  },
]

function advertisingProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'advertising',
    resources: provider.resources || ADVERTISING_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['publicidade', 'midia-paga', ...(provider.tags || [])],
  }
}

export const ADVERTISING_PROVIDERS: IntegrationProvider[] = [
  advertisingProvider({
    slug: 'meta_ads',
    toolkitSlug: 'META_ADS',
    name: 'Meta Ads',
    description: 'Campanhas, conjuntos, anuncios, criativos e insights de Meta Ads.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['facebook', 'instagram', 'paid-social'],
  }),
  advertisingProvider({
    slug: 'google_ads',
    toolkitSlug: 'GOOGLE_ADS',
    name: 'Google Ads',
    description: 'Customers, campanhas, grupos, anuncios, keywords e metricas de Google Ads.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['google', 'search', 'paid-search'],
  }),
]

export default ADVERTISING_PROVIDERS
