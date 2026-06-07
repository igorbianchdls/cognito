import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const SOCIAL_RESOURCES: IntegrationResource[] = [
  {
    slug: 'profiles',
    name: 'Perfis',
    description: 'Perfis, canais, paginas ou contas sociais conectadas.',
    defaultEnabled: true,
  },
  {
    slug: 'posts',
    name: 'Posts',
    description: 'Publicacoes organicas, legendas, links e metricas por post.',
    defaultEnabled: true,
  },
  {
    slug: 'videos',
    name: 'Videos',
    description: 'Videos, shorts, reels e metricas de visualizacao.',
    defaultEnabled: true,
  },
  {
    slug: 'comments',
    name: 'Comentarios',
    description: 'Comentarios e interacoes textuais quando disponiveis.',
    defaultEnabled: false,
  },
  {
    slug: 'audience_daily',
    name: 'Audiencia diaria',
    description: 'Seguidores, inscritos e audiencia por dia.',
    defaultEnabled: true,
  },
  {
    slug: 'performance_daily',
    name: 'Desempenho diario',
    description: 'Alcance, impressoes, visualizacoes e engajamento por dia.',
    defaultEnabled: true,
  },
  {
    slug: 'engagement_daily',
    name: 'Engajamento diario',
    description: 'Curtidas, comentarios, compartilhamentos, salvamentos e taxa de engajamento.',
    defaultEnabled: true,
  },
]

function socialProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'social',
    resources: provider.resources || SOCIAL_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['social', 'organico', ...(provider.tags || [])],
  }
}

export const SOCIAL_PROVIDERS: IntegrationProvider[] = [
  socialProvider({
    slug: 'instagram',
    toolkitSlug: 'INSTAGRAM',
    name: 'Instagram',
    description: 'Perfis, posts, reels, audiencia e engajamento organico do Instagram.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['meta', 'creator', 'posts'],
  }),
  socialProvider({
    slug: 'youtube',
    toolkitSlug: 'YOUTUBE',
    name: 'YouTube',
    description: 'Canais, videos, inscritos, visualizacoes e engajamento organico do YouTube.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['video', 'creator'],
  }),
  socialProvider({
    slug: 'linkedin',
    toolkitSlug: 'LINKEDIN',
    name: 'LinkedIn',
    description: 'Paginas, posts, audiencia e engajamento organico do LinkedIn.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['b2b', 'professional'],
  }),
  socialProvider({
    slug: 'tiktok',
    toolkitSlug: 'TIKTOK',
    name: 'TikTok',
    description: 'Perfis, videos, audiencia e engajamento organico do TikTok.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['video', 'creator'],
  }),
]

export default SOCIAL_PROVIDERS
