import { createBigQueryAdapter } from '@/products/plugin/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  AnalyticsAdapter,
  AnalyticsResource,
} from '@/products/plugin/server/domain-adapters/analytics/analyticsTypes'

const ANALYTICS_CONFIGS: ConnectedBigQueryResourceConfig<AnalyticsResource>[] = [
  {
    resource: 'propriedades',
    providerResource: 'accounts',
    table: 'analytics_accounts',
    datasetKind: 'normalized',
  },
  {
    resource: 'paginas',
    providerResource: 'pages_daily',
    table: 'analytics_pages_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'landing-pages',
    providerResource: 'pages_daily',
    table: 'analytics_pages_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'eventos',
    providerResource: 'events_daily',
    table: 'analytics_events_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'conversoes',
    providerResource: 'events_daily',
    table: 'analytics_events_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'canais',
    providerResource: 'traffic_daily',
    table: 'analytics_traffic_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'consultas',
    providerResource: 'queries_daily',
    table: 'analytics_queries_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'perfil-negocio',
    providerResource: 'locations',
    table: 'analytics_locations',
    datasetKind: 'normalized',
  },
  {
    resource: 'reviews',
    providerResource: 'reviews',
    table: 'analytics_reviews',
    datasetKind: 'normalized',
    dateField: 'created_at',
    orderBy: 'date_field',
  },
  {
    resource: 'posts-locais',
    providerResource: 'local_posts',
    table: 'analytics_local_posts',
    datasetKind: 'normalized',
    dateField: 'created_at',
    statusField: 'status',
    orderBy: 'date_field',
  },
]

export function createAnalyticsAdapter(provider: string): AnalyticsAdapter {
  return createBigQueryAdapter(provider, ANALYTICS_CONFIGS)
}
