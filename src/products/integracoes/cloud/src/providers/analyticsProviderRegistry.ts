import { googleMyBusinessConnector } from '@/products/integracoes/cloud/src/connectors/analytics/googleMyBusinessConnector'
import { googleAnalytics4Connector } from '@/products/integracoes/cloud/src/connectors/marketing/googleAnalytics4Connector'
import { googleSearchConsoleConnector } from '@/products/integracoes/cloud/src/connectors/marketing/googleSearchConsoleConnector'

export const ANALYTICS_CONNECTORS = [
  googleAnalytics4Connector,
  googleMyBusinessConnector,
  googleSearchConsoleConnector,
]
