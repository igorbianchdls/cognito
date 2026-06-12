import { googleMyBusinessConnector } from '@/products/integracoes/connectors/analytics/googleMyBusinessConnector'
import { googleAnalytics4Connector } from '@/products/integracoes/connectors/marketing/googleAnalytics4Connector'
import { googleSearchConsoleConnector } from '@/products/integracoes/connectors/marketing/googleSearchConsoleConnector'

export const ANALYTICS_CONNECTORS = [
  googleAnalytics4Connector,
  googleMyBusinessConnector,
  googleSearchConsoleConnector,
]
