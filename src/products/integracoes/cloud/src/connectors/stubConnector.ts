import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ConnectorResult } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

const STUB_RESULT: ConnectorResult = {
  status: 'success',
  recordsIn: 0,
  recordsUpdated: 0,
  recordsFailed: 0,
  metadata: {
    mode: 'stub',
  },
}

export function createStubConnector(params: {
  domain: IntegrationDomain
  provider: string
}): Connector {
  return {
    domain: params.domain,
    provider: params.provider,
    async testConnection() {
      return STUB_RESULT
    },
    async syncResource() {
      return STUB_RESULT
    },
    async refreshToken() {
      return STUB_RESULT
    },
  }
}
