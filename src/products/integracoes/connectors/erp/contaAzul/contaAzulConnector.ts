import type { Connector } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult } from '@/products/integracoes/connectors/base/ConnectorResult'
import {
  createContaAzulClient,
  extractContaAzulItems,
  validateContaAzulConnectorCredentials,
} from '@/products/integracoes/connectors/erp/contaAzul/contaAzulClient'
import { mapContaAzulRows } from '@/products/integracoes/connectors/erp/contaAzul/contaAzulMappers'
import type { ContaAzulResourceConfig } from '@/products/integracoes/connectors/erp/contaAzul/contaAzulTypes'
import {
  CONTA_AZUL_RESOURCE_MANIFEST,
  getContaAzulResourceConfig,
  listContaAzulSupportedResources,
} from '@/products/integracoes/connectors/erp/contaAzul/contaAzulResources'

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

function getNestedValue(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    return (current as Record<string, unknown>)[key]
  }, row)
}

function getFirstStringValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getNestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

function replacePathParams(path: string, value: string) {
  return path
    .replace('{id}', encodeURIComponent(value))
    .replace('{id_venda}', encodeURIComponent(value))
    .replace('{id_conta_financeira}', encodeURIComponent(value))
}

function getMaxDerivedPages() {
  const value = Number(process.env.CONTA_AZUL_MAX_DERIVED_PAGES || process.env.CONTA_AZUL_MAX_PAGES_PER_RESOURCE || 100)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 100
}

async function syncDerivedResource(input: {
  client: ReturnType<typeof createContaAzulClient>
  targetConfig: ContaAzulResourceConfig
  parentConfig: ContaAzulResourceConfig
  cursor?: Record<string, unknown>
}): Promise<ConnectorResult> {
  const derived = input.targetConfig.derivedFrom
  if (!derived) return warningResult(input.targetConfig.resource, 'Recurso derivado Conta Azul sem configuracao.')

  const batches = []
  let recordsIn = 0
  let recordsFailed = 0
  let truncated = false
  const pageSize = input.targetConfig.defaultPageSize
  const maxDerivedPages = getMaxDerivedPages()

  for await (const parentPage of input.client.paginate(input.parentConfig, {
    cursor: input.cursor,
  })) {
    for (const parent of parentPage.items) {
      const parentId = getFirstStringValue(parent, derived.idKeys)
      if (!parentId) {
        recordsFailed += 1
        continue
      }

      let childPage = 1
      let loadedChildPages = 0

      while (loadedChildPages < maxDerivedPages) {
        const payload = await input.client.requestPath({
          resource: input.targetConfig.resource,
          path: replacePathParams(derived.path, parentId),
          query: derived.responseMode === 'single'
            ? undefined
            : {
                pagina: childPage,
                tamanho_pagina: pageSize,
              },
        })
        const childItems = extractContaAzulItems(
          payload,
          derived.itemKeys || input.targetConfig.itemKeys,
          derived.responseMode,
        ).map((item) => ({
          ...item,
          parent_resource: derived.resource,
          parent_id: parentId,
        }))

        const rows = mapContaAzulRows({
          resource: input.targetConfig.resource,
          rows: childItems,
          page: childPage,
        })
        recordsIn += rows.length
        loadedChildPages += 1

        batches.push({
          resource: input.targetConfig.resource,
          rows,
          nextCursor: undefined,
        })

        const hasMore = derived.responseMode === 'single' ? false : childItems.length >= pageSize
        if (!hasMore) break
        childPage += 1
      }

      if (loadedChildPages >= maxDerivedPages) truncated = true
    }

    truncated = truncated || parentPage.truncated
  }

  return {
    status: truncated || recordsFailed ? 'warning' : 'success',
    recordsIn,
    recordsUpdated: recordsIn,
    recordsFailed,
    batches,
    errorMessage: recordsFailed ? `Alguns registros pai nao tinham ID para ${input.targetConfig.resource}.` : undefined,
    metadata: {
      mode: 'conta_azul_api',
      resource: input.targetConfig.resource,
      derivedFrom: derived.resource,
      truncated,
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
    if (config.derivedFrom) {
      const parentConfig = getContaAzulResourceConfig(config.derivedFrom.resource)
      if (!parentConfig) {
        return warningResult(resource, `Recurso pai Conta Azul nao configurado: ${config.derivedFrom.resource}.`)
      }
      return syncDerivedResource({
        client,
        targetConfig: config,
        parentConfig,
        cursor: context.cursor,
      })
    }

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
