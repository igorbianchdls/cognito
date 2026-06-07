import { listIntegrationConnections } from '@/products/integracoes/server/integrationConnectionRepository'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import {
  getCrmAdapter,
  listCrmAdapterProviders,
} from '@/products/mcp-apps/server/domain-adapters/crm/crmAdapterRegistry'
import {
  CONNECTED_CRM_RESOURCES,
  type ConnectedCrmAction,
  type ConnectedCrmResource,
  type ConnectedCrmToolInput,
} from '@/products/mcp-apps/server/domain-adapters/crm/crmTypes'
import { DomainAdapterError } from '@/products/mcp-apps/server/domain-adapters/shared/adapterErrors'
import type {
  ConnectedDomainProviderStatus,
  ConnectedDomainRecord,
  ConnectedDomainToolResult,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'
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

function normalizeAction(value: unknown): ConnectedCrmAction {
  const action = toText(value || 'listar').toLowerCase()
  if (action === 'listar' || action === 'ler') return action
  throw new DomainAdapterError('action invalida para connected_crm. Use listar ou ler.', {
    code: 'connected_crm_invalid_action',
    details: { action },
  })
}

function normalizeResource(value: unknown): ConnectedCrmResource {
  const resource = toText(value)
  if ((CONNECTED_CRM_RESOURCES as readonly string[]).includes(resource)) {
    return resource as ConnectedCrmResource
  }
  throw new DomainAdapterError(`resource invalido para connected_crm: ${resource}`, {
    code: 'connected_crm_invalid_resource',
    details: { resource, allowed: CONNECTED_CRM_RESOURCES },
  })
}

function normalizeFilters(input: ConnectedCrmToolInput) {
  return {
    ...asRecord(input.params),
    ...asRecord(input.filters),
  }
}

function emptyResult(
  action: ConnectedCrmAction,
  resource: ConnectedCrmResource,
  providers: ConnectedDomainProviderStatus[],
  errors: string[],
): ConnectedDomainToolResult {
  return {
    success: false,
    tool: 'connected_crm',
    action,
    resource,
    title: `Connected CRM - ${resource}`,
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
    domain: 'crm',
    provider: provider || undefined,
    limit: 50,
  })
  return connections.filter((connection) => ACTIVE_CONNECTION_STATUSES.has(connection.status))
}

export async function executeConnectedCrmTool(
  args: unknown,
  context: CognitoMcpServerContext = {},
): Promise<ConnectedDomainToolResult> {
  const input = asRecord(args) as ConnectedCrmToolInput
  const tenantId = getTenantId(context)
  const action = normalizeAction(input.action)
  const resource = normalizeResource(input.resource)
  const provider = toText(input.provider) || null
  const filters = normalizeFilters(input)
  const limit = toPositiveInt(input.limit ?? filters.limit, 50)
  const includeProviderFields = Boolean(input.include_provider_fields)
  const id = toText(input.id ?? filters.id)

  if (action === 'ler' && !id) {
    throw new DomainAdapterError('id e obrigatorio para connected_crm/action=ler', {
      code: 'connected_crm_missing_id',
    })
  }

  const connections = await listActiveConnections(tenantId, provider)
  if (!connections.length) {
    return emptyResult(action, resource, [], [
      provider
        ? `Nenhuma conexao CRM ativa encontrada para provider ${provider}.`
        : 'Nenhuma conexao CRM ativa encontrada para este tenant.',
    ])
  }

  const providers: ConnectedDomainProviderStatus[] = []
  const rows: ConnectedDomainRecord[] = []
  const warnings: string[] = []
  const errors: string[] = []

  for (const connection of connections) {
    const adapter = getCrmAdapter(connection.provider)
    if (!adapter) {
      const error = `Provider CRM sem adapter registrado: ${connection.provider}. Registrados: ${listCrmAdapterProviders().join(', ')}.`
      providers.push(connectionStatus(connection, false, error))
      errors.push(error)
      continue
    }

    if (!adapter.supports(resource, action)) {
      const error = `Provider ${connection.provider} nao suporta ${resource}/${action} em connected_crm.`
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
      providers.push(connectionStatus(connection, true))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no adapter connected_crm.'
      providers.push(connectionStatus(connection, false, message))
      errors.push(message)
    }
  }

  return {
    success: errors.length === 0,
    tool: 'connected_crm',
    action,
    resource,
    title: `Connected CRM - ${resource}`,
    rows,
    columns: rows.length ? Object.keys(rows[0]) : [],
    count: rows.length,
    providers,
    ...(errors.length ? { errors } : {}),
    ...(warnings.length ? { warnings } : {}),
  }
}
