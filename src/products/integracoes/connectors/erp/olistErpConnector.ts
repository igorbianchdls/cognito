import type { Connector } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/connectors/base/ConnectorResult'
import {
  createOlistErpClient,
  validateOlistErpConnectorCredentials,
} from '@/products/integracoes/connectors/erp/tiny/tinyClient'
import { mapOlistErpRows } from '@/products/integracoes/connectors/erp/tiny/tinyMappers'
import {
  getOlistErpResourceConfig,
  listOlistErpSupportedResources,
  OLIST_ERP_RESOURCE_MANIFEST,
} from '@/products/integracoes/connectors/erp/tiny/tinyResources'

function warningResult(resource: string, message: string): ConnectorResult {
  return {
    status: 'warning',
    recordsIn: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errorMessage: message,
    metadata: {
      resource,
      supportedResources: listOlistErpSupportedResources(),
    },
  }
}

export const olistErpConnector: Connector = {
  domain: 'erp',
  provider: 'olist_erp',
  resources: OLIST_ERP_RESOURCE_MANIFEST,
  validateCredentials: validateOlistErpConnectorCredentials,

  async testConnection(context: ConnectorContext): Promise<ConnectorResult> {
    const config = getOlistErpResourceConfig('produtos')
    if (!config) return warningResult('produtos', 'Recurso de teste Olist ERP nao configurado.')

    const client = createOlistErpClient(context.credentials)
    const page = await client.paginate(config, { pageSize: 1 }).next()

    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'olist_erp_api_v3',
        testResource: 'produtos',
        totalPages: page.value?.totalPages ?? null,
        totalRecords: page.value?.totalRecords ?? null,
      },
    }
  },

  async syncResource(context: ConnectorContext, resource: string): Promise<ConnectorResult> {
    const config = getOlistErpResourceConfig(resource)
    if (!config) {
      return warningResult(resource, `Recurso Olist ERP ainda nao mapeado para sincronizacao: ${resource}.`)
    }

    const client = createOlistErpClient(context.credentials)
    const batches = []
    let recordsIn = 0
    let truncated = false
    let totalPages: number | undefined
    let totalRecords: number | undefined

    for await (const page of client.paginate(config, {
      cursor: context.cursor,
    })) {
      const items = config.transformItems ? config.transformItems(page.items) : page.items
      const rows = mapOlistErpRows({
        resource,
        rows: items,
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
        mode: 'olist_erp_api_v3',
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
      errorMessage: 'Refresh OAuth do Olist ERP ainda precisa ser acionado pelo job de refresh token.',
      metadata: {
        mode: 'oauth2',
        refreshed: false,
      },
    }
  },
}
