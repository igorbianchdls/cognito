import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/connectors/base/ConnectorResult'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

export type ConnectorResourceManifest = {
  resource: string
  supportsIncremental?: boolean
  defaultPageSize?: number
  cursorKey?: string
  requiredFields?: string[]
}

export type Connector = {
  provider: string
  domain: IntegrationDomain
  resources?: ConnectorResourceManifest[]
  validateCredentials?: (credentials: unknown) => { ok: boolean; error?: string }
  testConnection: (context: ConnectorContext) => Promise<ConnectorResult>
  syncResource: (context: ConnectorContext, resource: string) => Promise<ConnectorResult>
  fetchChunk?: (context: ConnectorContext, resource: string, input: {
    cursor?: Record<string, unknown>
    pageSize?: number
  }) => Promise<ConnectorResult & {
    done: boolean
    nextCursor?: Record<string, unknown>
  }>
  refreshToken?: (context: ConnectorContext) => Promise<ConnectorResult>
}
