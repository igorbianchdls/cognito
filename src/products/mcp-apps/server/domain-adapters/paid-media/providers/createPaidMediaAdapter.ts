import { createBigQueryAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  PaidMediaAdapter,
  PaidMediaResource,
} from '@/products/mcp-apps/server/domain-adapters/paid-media/paidMediaTypes'

const PAID_MEDIA_CONFIGS: ConnectedBigQueryResourceConfig<PaidMediaResource>[] = [
  {
    resource: 'contas',
    providerResource: 'accounts',
  },
  {
    resource: 'campanhas',
    providerResource: 'campaigns',
    statusField: 'status',
  },
  {
    resource: 'anuncios',
    providerResource: 'ads',
    statusField: 'status',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'insights_campaign_daily',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
]

export function createPaidMediaAdapter(provider: string): PaidMediaAdapter {
  return createBigQueryAdapter(provider, PAID_MEDIA_CONFIGS)
}
