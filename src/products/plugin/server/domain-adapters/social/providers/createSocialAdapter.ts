import { createBigQueryAdapter } from '@/products/plugin/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  SocialAdapter,
  SocialResource,
} from '@/products/plugin/server/domain-adapters/social/socialTypes'

const SOCIAL_CONFIGS: ConnectedBigQueryResourceConfig<SocialResource>[] = [
  {
    resource: 'perfis',
    providerResource: 'profiles',
    table: 'social_profiles',
    datasetKind: 'normalized',
  },
  {
    resource: 'posts',
    providerResource: 'posts',
    table: 'social_posts',
    datasetKind: 'normalized',
    dateField: 'published_at',
    orderBy: 'date_field',
  },
  {
    resource: 'videos',
    providerResource: 'videos',
    table: 'social_videos',
    datasetKind: 'normalized',
    dateField: 'published_at',
    orderBy: 'date_field',
  },
  {
    resource: 'comentarios',
    providerResource: 'comments',
    table: 'social_comments',
    datasetKind: 'normalized',
    dateField: 'created_at',
    orderBy: 'date_field',
  },
  {
    resource: 'audiencia',
    providerResource: 'audience_daily',
    table: 'social_audience_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'performance_daily',
    table: 'social_performance_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'engajamento',
    providerResource: 'engagement_daily',
    table: 'social_engagement_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
]

export function createSocialAdapter(provider: string): SocialAdapter {
  return createBigQueryAdapter(provider, SOCIAL_CONFIGS)
}
