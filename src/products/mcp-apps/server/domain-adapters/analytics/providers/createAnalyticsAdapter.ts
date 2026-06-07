import { createPostgresAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createPostgresAdapter'
import type { ConnectedPostgresResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'
import type {
  AnalyticsAdapter,
  AnalyticsResource,
} from '@/products/mcp-apps/server/domain-adapters/analytics/analyticsTypes'

const ANALYTICS_CONFIGS: ConnectedPostgresResourceConfig<AnalyticsResource>[] = [
  {
    resource: 'propriedades',
    providerResource: 'accounts',
    table: 'analytics.accounts',
    orderBy: 't.id ASC',
  },
  {
    resource: 'paginas',
    providerResource: 'pages_daily',
    table: 'analytics.pages_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'landing-pages',
    providerResource: 'pages_daily',
    table: 'analytics.pages_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'eventos',
    providerResource: 'events_daily',
    table: 'analytics.events_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'conversoes',
    providerResource: 'events_daily',
    table: 'analytics.events_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'canais',
    providerResource: 'traffic_daily',
    table: 'analytics.traffic_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'consultas',
    providerResource: 'queries_daily',
    table: 'analytics.queries_daily',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'perfil-negocio',
    providerResource: 'locations',
    table: 'analytics.locations',
    orderBy: 't.id ASC',
  },
  {
    resource: 'reviews',
    providerResource: 'reviews',
    table: 'analytics.reviews',
    dateColumn: 'created_at',
    orderBy: 't.created_at DESC NULLS LAST, t.id DESC',
  },
]

export function createAnalyticsAdapter(provider: string): AnalyticsAdapter {
  return createPostgresAdapter(provider, ANALYTICS_CONFIGS)
}
