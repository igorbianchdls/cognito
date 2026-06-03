import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/cloud/src/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'
import { createOmieClient, validateOmieConnectorCredentials } from '@/products/integracoes/cloud/src/connectors/erp/omie/omieClient'
import { mapOmieRows } from '@/products/integracoes/cloud/src/connectors/erp/omie/omieMappers'
import {
  getOmieResourceConfig,
  listOmieSupportedResources,
  OMIE_RESOURCE_MANIFEST,
} from '@/products/integracoes/cloud/src/connectors/erp/omie/omieResources'

function warningResult(resource: string, message: string): ConnectorResult {
  return {
    status: 'warning',
    recordsIn: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errorMessage: message,
    metadata: {
      resource,
      supportedResources: listOmieSupportedResources(),
    },
  }
}

export const omieConnector: Connector = {
  domain: 'erp',
  provider: 'omie',
  resources: OMIE_RESOURCE_MANIFEST,
  validateCredentials: validateOmieConnectorCredentials,

  async testConnection(context: ConnectorContext): Promise<ConnectorResult> {
    const config = getOmieResourceConfig('clientes')
    if (!config) return warningResult('clientes', 'Recurso de teste Omie nao configurado.')

    const client = createOmieClient(context.credentials)
    const payload = await client.call(config, {
      pagina: 1,
      registros_por_pagina: 1,
      apenas_importado_api: 'N',
    })

    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'omie_api',
        testResource: 'clientes',
        totalPages: payload.total_de_paginas ?? payload.nTotPaginas ?? null,
        totalRecords: payload.total_de_registros ?? payload.nTotRegistros ?? null,
      },
    }
  },

  async syncResource(context: ConnectorContext, resource: string): Promise<ConnectorResult> {
    const config = getOmieResourceConfig(resource)
    if (!config) {
      return warningResult(resource, `Recurso Omie ainda nao mapeado para sincronizacao: ${resource}.`)
    }

    const client = createOmieClient(context.credentials)
    const batches = []
    let recordsIn = 0
    let truncated = false
    let totalPages: number | undefined
    let totalRecords: number | undefined

    for await (const page of client.paginate(config, {
      cursor: context.cursor,
    })) {
      const rows = mapOmieRows({
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
        mode: 'omie_api',
        resource,
        totalPages: totalPages ?? null,
        totalRecords: totalRecords ?? null,
        truncated,
      },
    }
  },

  async refreshToken(): Promise<ConnectorResult> {
    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'api_key',
        refreshed: false,
      },
    }
  },
}
