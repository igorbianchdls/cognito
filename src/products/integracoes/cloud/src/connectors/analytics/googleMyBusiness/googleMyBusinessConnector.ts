import { createDateRangeReportConnector } from '@/products/integracoes/cloud/src/connectors/marketing/common/dateRangeReportConnector'
import { GOOGLE_MY_BUSINESS_RESOURCES } from '@/products/integracoes/cloud/src/connectors/analytics/googleMyBusiness/googleMyBusinessResources'

export const googleMyBusinessConnector = createDateRangeReportConnector({
  domain: 'analytics',
  provider: 'google_my_business',
  defaultBaseUrl: 'https://mybusiness.googleapis.com',
  envBaseUrlKey: 'GOOGLE_MY_BUSINESS_API_BASE_URL',
  resources: GOOGLE_MY_BUSINESS_RESOURCES,
  testResource: 'accounts',
  rateLimitMs: Number(process.env.GOOGLE_MY_BUSINESS_RATE_LIMIT_MS || 250),
})
