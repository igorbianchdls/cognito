import {
  getIntegrationPluginPermissions,
  listIntegrationConnections,
} from '@/products/integracoes/server/integrationConnectionRepository'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'
import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainProviderStatus,
  ConnectedDomainRecord,
  ConnectedDomainToolResult,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import { DomainAdapterError } from '@/products/plugin/server/domain-adapters/shared/adapterErrors'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

type JsonRecord = Record<string, unknown>

export type GenericConnectedAdapter<Resource extends string> = {
  provider: string
  supports: (resource: Resource, action: ConnectedDomainAction) => boolean
  list: (input: ConnectedDomainAdapterInput<Resource>) => Promise<ConnectedDomainAdapterResult>
  read: (input: ConnectedDomainAdapterReadInput<Resource>) => Promise<ConnectedDomainAdapterResult>
}

export type GenericConnectedServiceConfig<Resource extends string> = {
  tool: string
  integrationDomain: IntegrationDomain
  resources: readonly Resource[]
  getAdapter: (provider: string) => GenericConnectedAdapter<Resource> | undefined
  listAdapterProviders: () => string[]
}

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

function normalizeAction(tool: string, value: unknown): ConnectedDomainAction {
  const action = toText(value || 'listar').toLowerCase()
  if (action === 'listar' || action === 'ler') return action
  throw new DomainAdapterError(`action invalida para ${tool}. Use listar ou ler.`, {
    code: `${tool}_invalid_action`,
    details: { action },
  })
}

function normalizeResource<Resource extends string>(
  tool: string,
  resources: readonly Resource[],
  value: unknown,
): Resource {
  const resource = toText(value)
  if ((resources as readonly string[]).includes(resource)) return resource as Resource
  throw new DomainAdapterError(`resource invalido para ${tool}: ${resource}`, {
    code: `${tool}_invalid_resource`,
    details: { resource, allowed: resources },
  })
}

function connectionStatus(
  provider: string,
  connectionId: string,
  displayName: string,
  ok: boolean,
  error?: string,
) {
  return {
    provider,
    connection_id: connectionId,
    display_name: displayName,
    ok,
    error,
  }
}

export async function executeGenericConnectedTool<Resource extends string>(
  args: unknown,
  context: CognitoMcpServerContext,
  config: GenericConnectedServiceConfig<Resource>,
): Promise<ConnectedDomainToolResult> {
  const input = asRecord(args)
  const tenantId = getTenantId(context)
  const action = normalizeAction(config.tool, input.action)
  const resource = normalizeResource(config.tool, config.resources, input.resource)
  const provider = toText(input.provider) || null
  const filters = { ...asRecord(input.params), ...asRecord(input.filters) }
  const limit = toPositiveInt(input.limit ?? filters.limit, 50)
  const includeProviderFields = Boolean(input.include_provider_fields)
  const id = toText(input.id ?? filters.id)

  if (action === 'ler' && !id) {
    throw new DomainAdapterError(`id e obrigatorio para ${config.tool}/action=ler`, {
      code: `${config.tool}_missing_id`,
    })
  }

  const connections = (
    await listIntegrationConnections({
      tenantId,
      domain: config.integrationDomain,
      provider: provider || undefined,
      limit: 50,
    })
  ).filter((connection) => ACTIVE_CONNECTION_STATUSES.has(connection.status))

  if (!connections.length) {
    return {
      success: false,
      tool: config.tool,
      action,
      resource,
      title: `${config.tool} - ${resource}`,
      rows: [],
      columns: [],
      count: 0,
      providers: [],
      errors: [
        provider
          ? `Nenhuma conexao ativa encontrada para provider ${provider}.`
          : `Nenhuma conexao ativa encontrada para o dominio ${config.integrationDomain}.`,
      ],
    }
  }

  const rows: ConnectedDomainRecord[] = []
  const providers: ConnectedDomainProviderStatus[] = []
  const errors: string[] = []
  const warnings: string[] = []

  for (const connection of connections) {
    const permissions = await getIntegrationPluginPermissions(connection.id, tenantId)
    if (!permissions?.enabled) {
      const error = `MCP nao esta habilitado para a conexao ${connection.displayName}.`
      providers.push(connectionStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }

    const adapter = config.getAdapter(connection.provider)
    if (!adapter) {
      const error = `Provider sem adapter registrado para ${config.tool}: ${connection.provider}. Registrados: ${config.listAdapterProviders().join(', ')}.`
      providers.push(connectionStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }

    if (!adapter.supports(resource, action)) {
      const error = `Provider ${connection.provider} nao suporta ${resource}/${action} em ${config.tool}.`
      providers.push(connectionStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }

    try {
      const result = action === 'listar'
        ? await adapter.list({ tenantId, connection, resource, filters, limit, includeProviderFields })
        : await adapter.read({ tenantId, connection, resource, filters, limit, includeProviderFields, id })
      rows.push(...result.rows)
      warnings.push(...(result.warnings || []))
      providers.push(connectionStatus(connection.provider, connection.id, connection.displayName, true))
    } catch (error) {
      const message = error instanceof Error ? error.message : `Erro desconhecido em ${config.tool}.`
      providers.push(connectionStatus(connection.provider, connection.id, connection.displayName, false, message))
      errors.push(message)
    }
  }

  return {
    success: errors.length === 0,
    tool: config.tool,
    action,
    resource,
    title: `${config.tool} - ${resource}`,
    rows,
    columns: rows.length ? Object.keys(rows[0]) : [],
    count: rows.length,
    providers,
    ...(errors.length ? { errors } : {}),
    ...(warnings.length ? { warnings } : {}),
  }
}
