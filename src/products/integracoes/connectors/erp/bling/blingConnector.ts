import type { Connector } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/connectors/base/ConnectorResult'
import { createBlingClient, validateBlingConnectorCredentials } from '@/products/integracoes/connectors/erp/bling/blingClient'
import { mapBlingRows } from '@/products/integracoes/connectors/erp/bling/blingMappers'
import {
  BLING_RESOURCE_MANIFEST,
  getBlingResourceConfig,
  listBlingSupportedResources,
} from '@/products/integracoes/connectors/erp/bling/blingResources'

function warningResult(resource: string, message: string): ConnectorResult {
  return {
    status: 'warning',
    recordsIn: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errorMessage: message,
    metadata: {
      resource,
      supportedResources: listBlingSupportedResources(),
    },
  }
}

export const blingConnector: Connector = {
  domain: 'erp',
  provider: 'bling',
  resources: BLING_RESOURCE_MANIFEST,
  validateCredentials: validateBlingConnectorCredentials,

  async testConnection(context: ConnectorContext): Promise<ConnectorResult> {
    const config = getBlingResourceConfig('produtos')
    if (!config) return warningResult('produtos', 'Recurso de teste Bling nao configurado.')

    const client = createBlingClient(context.credentials)
    const page = await client.paginate(config, { pageSize: 1 }).next()

    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'bling_api_v3',
        testResource: 'produtos',
        totalPages: page.value?.totalPages ?? null,
        totalRecords: page.value?.totalRecords ?? null,
      },
    }
  },

  async syncResource(context: ConnectorContext, resource: string): Promise<ConnectorResult> {
    const config = getBlingResourceConfig(resource)
    if (!config) {
      return warningResult(resource, `Recurso Bling ainda nao mapeado para sincronizacao: ${resource}.`)
    }

    const client = createBlingClient(context.credentials)
    const batches = []
    let recordsIn = 0
    let truncated = false
    let totalPages: number | undefined
    let totalRecords: number | undefined

    for await (const page of client.paginate(config, {
      cursor: context.cursor,
    })) {
      const rows = mapBlingRows({
        resource,
        rows: page.items,
        page: page.page,
      })
      recordsIn += rows.length
      totalPages = page.totalPages ?? totalPages
      totalRecords = page.totalRecords ?? totalRecords
      truncated = truncated || page.truncated

      batches.push({
        resource,
        rows,
        nextCursor: page.hasMore && !page.truncated ? { page: page.page + 1 } : undefined,
      })
    }

    return {
      status: truncated ? 'warning' : 'success',
      recordsIn,
      recordsUpdated: recordsIn,
      recordsFailed: 0,
      batches,
      metadata: {
        mode: 'bling_api_v3',
        resource,
        totalPages: totalPages ?? null,
        totalRecords: totalRecords ?? null,
        truncated,
      },
    }
  },

  async refreshToken(): Promise<ConnectorResult> {
    return {
      status: 'warning',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errorMessage: 'Refresh OAuth do Bling ainda precisa ser acionado pelo job de refresh token.',
      metadata: {
        mode: 'oauth2',
        refreshed: false,
      },
    }
  },
}
