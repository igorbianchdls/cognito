import { createDateRangeReportConnector } from '@/products/integracoes/cloud/src/connectors/marketing/common/dateRangeReportConnector'
import { GOOGLE_SEARCH_CONSOLE_RESOURCES } from '@/products/integracoes/cloud/src/connectors/marketing/googleSearchConsole/googleSearchConsoleResources'

export const googleSearchConsoleConnector = createDateRangeReportConnector({
  domain: 'analytics',
  provider: 'google_search_console',
  defaultBaseUrl: 'https://www.googleapis.com/webmasters/v3',
  envBaseUrlKey: 'GOOGLE_SEARCH_CONSOLE_API_BASE_URL',
  resources: GOOGLE_SEARCH_CONSOLE_RESOURCES,
  testResource: 'accounts',
  rateLimitMs: Number(process.env.GOOGLE_SEARCH_CONSOLE_RATE_LIMIT_MS || 100),
})
