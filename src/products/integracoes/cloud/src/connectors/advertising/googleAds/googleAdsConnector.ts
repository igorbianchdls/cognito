import { createDateRangeReportConnector } from '@/products/integracoes/cloud/src/connectors/marketing/common/dateRangeReportConnector'
import { GOOGLE_ADS_RESOURCES } from '@/products/integracoes/cloud/src/connectors/advertising/googleAds/googleAdsResources'

export const googleAdsConnector = createDateRangeReportConnector({
  domain: 'advertising',
  provider: 'google_ads',
  defaultBaseUrl: 'https://googleads.googleapis.com/v18',
  envBaseUrlKey: 'GOOGLE_ADS_API_BASE_URL',
  resources: GOOGLE_ADS_RESOURCES,
  testResource: 'accounts',
  rateLimitMs: Number(process.env.GOOGLE_ADS_RATE_LIMIT_MS || 250),
})
