import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/cloud/src/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'
import { createLinxClient, validateLinxConnectorCredentials } from '@/products/integracoes/cloud/src/connectors/erp/linx/linxClient'
import { mapLinxRows } from '@/products/integracoes/cloud/src/connectors/erp/linx/linxMappers'
import {
  getLinxResourceConfig,
  LINX_RESOURCE_MANIFEST,
  listLinxSupportedResources,
} from '@/products/integracoes/cloud/src/connectors/erp/linx/linxResources'

function warningResult(resource: string, message: string): ConnectorResult {
  return {
    status: 'warning',
    recordsIn: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errorMessage: message,
    metadata: {
      resource,
      supportedResources: listLinxSupportedResources(),
    },
  }
}

export const linxConnector: Connector = {
  domain: 'erp',
  provider: 'linx',
  resources: LINX_RESOURCE_MANIFEST,
  validateCredentials: validateLinxConnectorCredentials,

  async testConnection(context: ConnectorContext): Promise<ConnectorResult> {
    const config = getLinxResourceConfig('produtos')
    if (!config) return warningResult('produtos', 'Recurso de teste Linx nao configurado.')

    const client = createLinxClient(context.credentials)
    const page = await client.paginate(config, { pageSize: 1 }).next()

    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'linx_api',
        testResource: 'produtos',
        totalPages: page.value?.totalPages ?? null,
        totalRecords: page.value?.totalRecords ?? null,
      },
    }
  },

  async syncResource(context: ConnectorContext, resource: string): Promise<ConnectorResult> {
    const config = getLinxResourceConfig(resource)
    if (!config) {
      return warningResult(resource, `Recurso Linx ainda nao mapeado para sincronizacao: ${resource}.`)
    }

    const client = createLinxClient(context.credentials)
    const batches = []
    let recordsIn = 0
    let truncated = false
    let totalPages: number | undefined
    let totalRecords: number | undefined

    for await (const page of client.paginate(config, {
      cursor: context.cursor,
    })) {
      const rows = mapLinxRows({
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
        mode: 'linx_api',
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
      errorMessage: 'Refresh OAuth da Linx ainda precisa ser acionado pelo job de refresh token.',
      metadata: {
        mode: 'oauth2',
        refreshed: false,
      },
    }
  },
}
