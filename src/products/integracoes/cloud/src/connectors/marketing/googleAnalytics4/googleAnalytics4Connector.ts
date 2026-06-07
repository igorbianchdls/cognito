import { createDateRangeReportConnector } from '@/products/integracoes/cloud/src/connectors/marketing/common/dateRangeReportConnector'
import { GOOGLE_ANALYTICS_4_RESOURCES } from '@/products/integracoes/cloud/src/connectors/marketing/googleAnalytics4/googleAnalytics4Resources'

export const googleAnalytics4Connector = createDateRangeReportConnector({
  domain: 'analytics',
  provider: 'google_analytics_4',
  defaultBaseUrl: 'https://analyticsdata.googleapis.com/v1beta',
  envBaseUrlKey: 'GOOGLE_ANALYTICS_4_API_BASE_URL',
  resources: GOOGLE_ANALYTICS_4_RESOURCES,
  testResource: 'accounts',
  rateLimitMs: Number(process.env.GOOGLE_ANALYTICS_4_RATE_LIMIT_MS || 100),
})
