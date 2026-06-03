import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/cloud/src/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'
import { createContaAzulClient, validateContaAzulConnectorCredentials } from '@/products/integracoes/cloud/src/connectors/erp/contaAzul/contaAzulClient'
import { mapContaAzulRows } from '@/products/integracoes/cloud/src/connectors/erp/contaAzul/contaAzulMappers'
import {
  CONTA_AZUL_RESOURCE_MANIFEST,
  getContaAzulResourceConfig,
  listContaAzulSupportedResources,
} from '@/products/integracoes/cloud/src/connectors/erp/contaAzul/contaAzulResources'

function warningResult(resource: string, message: string): ConnectorResult {
  return {
    status: 'warning',
    recordsIn: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errorMessage: message,
    metadata: {
      resource,
      supportedResources: listContaAzulSupportedResources(),
    },
  }
}

export const contaAzulConnector: Connector = {
  domain: 'erp',
  provider: 'conta_azul',
  resources: CONTA_AZUL_RESOURCE_MANIFEST,
  validateCredentials: validateContaAzulConnectorCredentials,

  async testConnection(context: ConnectorContext): Promise<ConnectorResult> {
    const config = getContaAzulResourceConfig('clientes')
    if (!config) return warningResult('clientes', 'Recurso de teste Conta Azul nao configurado.')

    const client = createContaAzulClient(context.credentials)
    const page = await client.paginate(config, { pageSize: 1 }).next()

    return {
      status: 'success',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      metadata: {
        mode: 'conta_azul_api',
        testResource: 'clientes',
        totalPages: page.value?.totalPages ?? null,
        totalRecords: page.value?.totalRecords ?? null,
      },
    }
  },

  async syncResource(context: ConnectorContext, resource: string): Promise<ConnectorResult> {
    const config = getContaAzulResourceConfig(resource)
    if (!config) {
      return warningResult(resource, `Recurso Conta Azul ainda nao mapeado para sincronizacao: ${resource}.`)
    }

    const client = createContaAzulClient(context.credentials)
    const batches = []
    let recordsIn = 0
    let truncated = false
    let totalPages: number | undefined
    let totalRecords: number | undefined

    for await (const page of client.paginate(config, {
      cursor: context.cursor,
    })) {
      const rows = mapContaAzulRows({
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
        mode: 'conta_azul_api',
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
      errorMessage: 'Refresh OAuth da Conta Azul ainda precisa ser acionado pelo job de refresh token.',
      metadata: {
        mode: 'oauth2',
        refreshed: false,
      },
    }
  },
}
