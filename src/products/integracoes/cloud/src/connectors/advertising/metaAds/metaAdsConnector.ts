import { createDateRangeReportConnector } from '@/products/integracoes/cloud/src/connectors/marketing/common/dateRangeReportConnector'
import { META_ADS_RESOURCES } from '@/products/integracoes/cloud/src/connectors/advertising/metaAds/metaAdsResources'

export const metaAdsConnector = createDateRangeReportConnector({
  domain: 'advertising',
  provider: 'meta_ads',
  defaultBaseUrl: 'https://graph.facebook.com/v20.0',
  envBaseUrlKey: 'META_ADS_API_BASE_URL',
  resources: META_ADS_RESOURCES,
  testResource: 'accounts',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_META_ADS_MS || 300),
})
