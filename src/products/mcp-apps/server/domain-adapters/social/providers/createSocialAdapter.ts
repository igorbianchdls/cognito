import { createPostgresAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createPostgresAdapter'
import type { ConnectedPostgresResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'
import type {
  SocialAdapter,
  SocialResource,
} from '@/products/mcp-apps/server/domain-adapters/social/socialTypes'

const SOCIAL_CONFIGS: ConnectedPostgresResourceConfig<SocialResource>[] = [
  {
    resource: 'perfis',
    providerResource: 'profiles',
    table: 'social.profiles',
    orderBy: 't.id ASC',
  },
  {
    resource: 'posts',
    providerResource: 'posts',
    table: 'social.posts',
    dateColumn: 'published_at',
    orderBy: 't.published_at DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'videos',
    providerResource: 'videos',
    table: 'social.videos',
    dateColumn: 'published_at',
    orderBy: 't.published_at DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'comentarios',
    providerResource: 'comments',
    table: 'social.comments',
    dateColumn: 'created_at',
    orderBy: 't.created_at DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'audiencia',
    providerResource: 'audience_daily',
    table: 'social.audience_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'performance_daily',
    table: 'social.performance_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'engajamento',
    providerResource: 'engagement_daily',
    table: 'social.engagement_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
]

export function createSocialAdapter(provider: string): SocialAdapter {
  return createPostgresAdapter(provider, SOCIAL_CONFIGS)
}
