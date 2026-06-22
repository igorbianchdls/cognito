import { createBigQueryAdapter } from '@/products/plugin/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  PaidMediaAdapter,
  PaidMediaResource,
} from '@/products/plugin/server/domain-adapters/paid-media/paidMediaTypes'

const PAID_MEDIA_CONFIGS: ConnectedBigQueryResourceConfig<PaidMediaResource>[] = [
  {
    resource: 'contas',
    providerResource: 'accounts',
    table: 'paid_media_accounts',
    datasetKind: 'normalized',
  },
  {
    resource: 'campanhas',
    providerResource: 'campaigns',
    table: 'paid_media_campaigns',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'grupos',
    providerResource: 'ad_groups',
    table: 'paid_media_ad_groups',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'anuncios',
    providerResource: 'ads',
    table: 'paid_media_ads',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'criativos',
    providerResource: 'creatives',
    table: 'paid_media_creatives',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'keywords',
    providerResource: 'keywords',
    table: 'paid_media_keywords',
    datasetKind: 'normalized',
    statusField: 'status',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'conversoes',
    providerResource: 'conversions',
    table: 'paid_media_conversions',
    datasetKind: 'normalized',
    statusField: 'status',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'insights_campaign_daily',
    table: 'paid_media_insights_daily',
    datasetKind: 'normalized',
    dateField: 'data_ref',
    orderBy: 'date_field',
  },
]

export function createPaidMediaAdapter(provider: string): PaidMediaAdapter {
  const configs = provider === 'meta_ads'
    ? PAID_MEDIA_CONFIGS.filter((config) => config.resource !== 'keywords')
    : PAID_MEDIA_CONFIGS
  return createBigQueryAdapter(provider, configs)
}
