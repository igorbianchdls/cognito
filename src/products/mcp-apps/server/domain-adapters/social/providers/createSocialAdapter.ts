import { createBigQueryAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  SocialAdapter,
  SocialResource,
} from '@/products/mcp-apps/server/domain-adapters/social/socialTypes'

const SOCIAL_CONFIGS: ConnectedBigQueryResourceConfig<SocialResource>[] = [
  {
    resource: 'perfis',
    providerResource: 'profiles',
  },
  {
    resource: 'posts',
    providerResource: 'posts',
    dateField: 'published_at',
    orderBy: 'date_field',
  },
  {
    resource: 'videos',
    providerResource: 'videos',
    dateField: 'published_at',
    orderBy: 'date_field',
  },
  {
    resource: 'comentarios',
    providerResource: 'comments',
    dateField: 'created_at',
    orderBy: 'date_field',
  },
  {
    resource: 'audiencia',
    providerResource: 'audience_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'performance_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'engajamento',
    providerResource: 'engagement_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
]

export function createSocialAdapter(provider: string): SocialAdapter {
  return createBigQueryAdapter(provider, SOCIAL_CONFIGS)
}
