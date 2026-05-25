import type { ConnectorContext } from '@/products/integracoes/cloud/src/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

export type Connector = {
  provider: string
  domain: IntegrationDomain
  testConnection: (context: ConnectorContext) => Promise<ConnectorResult>
  syncResource: (context: ConnectorContext, resource: string) => Promise<ConnectorResult>
  refreshToken?: (context: ConnectorContext) => Promise<ConnectorResult>
}
