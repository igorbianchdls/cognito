import {
  getIntegrationPluginPermissions,
  listIntegrationConnections,
} from '@/products/integracoes/server/integrationConnectionRepository'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import {
  getErpApiAdapter,
  listErpApiAdapterProviders,
} from '@/products/plugin/server/domain-adapters/erp/erpApiAdapterRegistry'
import {
  getErpAdapter,
  listErpAdapterProviders,
} from '@/products/plugin/server/domain-adapters/erp/erpAdapterRegistry'
import {
  CONNECTED_ERP_RESOURCES,
  type ConnectedErpAction,
  type ConnectedErpResource,
  type ConnectedErpToolInput,
} from '@/products/plugin/server/domain-adapters/erp/erpTypes'
import { DomainAdapterError } from '@/products/plugin/server/domain-adapters/shared/adapterErrors'
import type {
  ConnectedDomainFreshness,
  ConnectedDomainProviderStatus,
  ConnectedDomainRecord,
  ConnectedDomainToolResult,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

type JsonRecord = Record<string, unknown>

const ACTIVE_CONNECTION_STATUSES = new Set(['connected', 'syncing', 'warning'])

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(toText(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : fallback
}

function getTenantId(context: CognitoMcpServerContext) {
  return context.tenantId && context.tenantId > 0 ? context.tenantId : 1
}

function normalizeAction(value: unknown): ConnectedErpAction {
  const action = toText(value || 'listar').toLowerCase()
  if (action === 'listar' || action === 'ler' || action === 'listar_live' || action === 'ler_live') return action
  throw new DomainAdapterError('action invalida para connected_erp. Use listar, ler, listar_live ou ler_live.', {
    code: 'connected_erp_invalid_action',
    details: { action },
  })
}

function normalizeResource(value: unknown): ConnectedErpResource {
  const resource = toText(value)
  if ((CONNECTED_ERP_RESOURCES as readonly string[]).includes(resource)) {
    return resource as ConnectedErpResource
  }
  throw new DomainAdapterError(`resource invalido para connected_erp: ${resource}`, {
    code: 'connected_erp_invalid_resource',
    details: { resource, allowed: CONNECTED_ERP_RESOURCES },
  })
}

function normalizeFilters(input: ConnectedErpToolInput) {
  const topLevelFilters: JsonRecord = {}
  const passthroughKeys = [
    'q',
    'search',
    'query',
    'status',
    'situacao',
    'de',
    'ate',
    'date_from',
    'date_to',
    'start_date',
    'end_date',
    'data_campo',
    'date_field',
    'sort_by',
    'sort_dir',
    'order_by',
    'order_dir',
    'mode',
    'aggregate',
    'metric',
    'metrics',
    'value_field',
    'valor_campo',
    'group_by',
    'granularity',
    'valor_min',
    'valor_max',
    'min_value',
    'max_value',
    'external_id',
    'cliente_id',
    'fornecedor_id',
    'produto_id',
    'categoria_id',
    'centro_custo_id',
    'vendedor_id',
    'conta_financeira_id',
    'documento',
    'numero',
  ] as const
  for (const key of passthroughKeys) {
    const value = input[key as keyof ConnectedErpToolInput]
    if (value !== undefined) topLevelFilters[key] = value
  }
  return {
    ...topLevelFilters,
    ...asRecord(input.params),
    ...asRecord(input.filters),
  }
}

function emptyResult(
  action: ConnectedErpAction,
  resource: ConnectedErpResource,
  providers: ConnectedDomainProviderStatus[],
  errors: string[],
): ConnectedDomainToolResult {
  return {
    success: false,
    tool: 'connected_erp',
    action,
    resource,
    title: `Connected ERP - ${resource}`,
    rows: [],
    columns: [],
    count: 0,
    providers,
    errors,
  }
}

function connectionStatus(connection: IntegrationConnection, ok: boolean, error?: string) {
  return {
    provider: connection.provider,
    connection_id: connection.id,
    display_name: connection.displayName,
    ok,
    error,
  }
}

async function listActiveConnections(tenantId: number, provider: string | null) {
  const connections = await listIntegrationConnections({
    tenantId,
    domain: 'erp',
    provider: provider || undefined,
    limit: 50,
  })
  return connections.filter((connection) => ACTIVE_CONNECTION_STATUSES.has(connection.status))
}

export async function executeConnectedErpTool(
  args: unknown,
  context: CognitoMcpServerContext = {},
): Promise<ConnectedDomainToolResult> {
  const input = asRecord(args) as ConnectedErpToolInput
  const tenantId = getTenantId(context)
  const action = normalizeAction(input.action)
  const resource = normalizeResource(input.resource)
  const provider = toText(input.provider) || null
  const filters = normalizeFilters(input)
  const limit = toPositiveInt(input.limit ?? filters.limit, 50)
  const includeProviderFields = Boolean(input.include_provider_fields)
  const id = toText(input.id ?? filters.id)

  if ((action === 'ler' || action === 'ler_live') && !id) {
    throw new DomainAdapterError(`id e obrigatorio para connected_erp/action=${action}`, {
      code: 'connected_erp_missing_id',
    })
  }

  const connections = await listActiveConnections(tenantId, provider)
  if (!connections.length) {
    return emptyResult(action, resource, [], [
      provider
        ? `Nenhuma conexao ERP ativa encontrada para provider ${provider}.`
        : 'Nenhuma conexao ERP ativa encontrada para este tenant.',
    ])
  }

  const providers: ConnectedDomainProviderStatus[] = []
  const rows: ConnectedDomainRecord[] = []
  const warnings: string[] = []
  const freshness: ConnectedDomainFreshness[] = []
  const errors: string[] = []

  for (const connection of connections) {
    if (action === 'listar_live' || action === 'ler_live') {
      const permissions = await getIntegrationPluginPermissions(connection.id, tenantId)
      if (!permissions?.enabled) {
        const error = `MCP nao esta habilitado para a conexao ${connection.displayName}.`
        providers.push(connectionStatus(connection, false, error))
        errors.push(error)
        continue
      }

      const apiAdapter = getErpApiAdapter(connection.provider)
      if (!apiAdapter) {
        const error = `Provider ERP sem adapter API live registrado: ${connection.provider}. Registrados: ${listErpApiAdapterProviders().join(', ') || 'nenhum'}.`
        providers.push(connectionStatus(connection, false, error))
        errors.push(error)
        continue
      }
      if (!apiAdapter.supportsLiveRead(resource)) {
        const error = `Provider ${connection.provider} nao suporta leitura live de ${resource}.`
        providers.push(connectionStatus(connection, false, error))
        errors.push(error)
        continue
      }

      try {
        const result = action === 'listar_live'
          ? await apiAdapter.listLive({ tenantId, connection, resource, filters, limit, includeProviderFields })
          : await apiAdapter.readLive({ tenantId, connection, resource, filters, limit, includeProviderFields, id })
        rows.push(...result.rows)
        warnings.push(...(result.warnings || []))
        freshness.push(...(result.freshness || []))
        providers.push(connectionStatus(connection, true))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido no adapter API connected_erp.'
        providers.push(connectionStatus(connection, false, message))
        errors.push(message)
      }
      continue
    }

    const adapter = getErpAdapter(connection.provider)
    if (!adapter) {
      const error = `Provider ERP sem adapter registrado: ${connection.provider}. Registrados: ${listErpAdapterProviders().join(', ')}.`
      providers.push(connectionStatus(connection, false, error))
      errors.push(error)
      continue
    }

    if (!adapter.supports(resource, action)) {
      const error = `Provider ${connection.provider} nao suporta ${resource}/${action} em connected_erp.`
      providers.push(connectionStatus(connection, false, error))
      errors.push(error)
      continue
    }

    try {
      const result = action === 'listar'
        ? await adapter.list({ tenantId, connection, resource, filters, limit, includeProviderFields })
        : await adapter.read({ tenantId, connection, resource, filters, limit, includeProviderFields, id })
      rows.push(...result.rows)
      warnings.push(...(result.warnings || []))
      freshness.push(...(result.freshness || []))
      providers.push(connectionStatus(connection, true))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no adapter connected_erp.'
      providers.push(connectionStatus(connection, false, message))
      errors.push(message)
    }
  }

  return {
    success: errors.length === 0,
    tool: 'connected_erp',
    action,
    resource,
    title: `Connected ERP - ${resource}`,
    rows,
    columns: rows.length ? Object.keys(rows[0]) : [],
    count: rows.length,
    providers,
    ...(errors.length ? { errors } : {}),
    ...(warnings.length ? { warnings } : {}),
    ...(freshness.length ? { freshness } : {}),
  }
}
