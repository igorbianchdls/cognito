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
  },
  {
    resource: 'paginas',
    providerResource: 'pages_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'landing-pages',
    providerResource: 'pages_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'eventos',
    providerResource: 'events_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'conversoes',
    providerResource: 'events_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'canais',
    providerResource: 'traffic_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'consultas',
    providerResource: 'queries_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'perfil-negocio',
    providerResource: 'locations',
  },
  {
    resource: 'reviews',
    providerResource: 'reviews',
    dateField: 'created_at',
    orderBy: 'date_field',
  },
]

export function createAnalyticsAdapter(provider: string): AnalyticsAdapter {
  return createBigQueryAdapter(provider, ANALYTICS_CONFIGS)
}
