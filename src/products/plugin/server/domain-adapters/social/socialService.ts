import {
  getIntegrationPluginPermissions,
  listIntegrationConnections,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  getSocialAdapter,
  listSocialAdapterProviders,
} from '@/products/plugin/server/domain-adapters/social/socialAdapterRegistry'
import {
  getSocialApiAdapter,
  listSocialApiAdapterProviders,
} from '@/products/plugin/server/domain-adapters/social/socialApiAdapterRegistry'
import {
  SOCIAL_RESOURCES,
  type SocialResource,
} from '@/products/plugin/server/domain-adapters/social/socialTypes'
import { DomainAdapterError } from '@/products/plugin/server/domain-adapters/shared/adapterErrors'
import type {
  ConnectedDomainAction,
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

function normalizeAction(value: unknown): ConnectedDomainAction {
  const action = toText(value || 'listar').toLowerCase()
  if (action === 'listar' || action === 'ler' || action === 'listar_live' || action === 'ler_live') return action
  throw new DomainAdapterError('action invalida para social. Use listar, ler, listar_live ou ler_live.', {
    code: 'social_invalid_action',
    details: { action },
  })
}

function normalizeResource(value: unknown): SocialResource {
  const resource = toText(value)
  if ((SOCIAL_RESOURCES as readonly string[]).includes(resource)) return resource as SocialResource
  throw new DomainAdapterError(`resource invalido para social: ${resource}`, {
    code: 'social_invalid_resource',
    details: { resource, allowed: SOCIAL_RESOURCES },
  })
}

function providerStatus(provider: string, connectionId: string, displayName: string, ok: boolean, error?: string): ConnectedDomainProviderStatus {
  return {
    provider,
    connection_id: connectionId,
    display_name: displayName,
    ok,
    error,
  }
}

export async function executeSocialTool(
  args: unknown,
  context: CognitoMcpServerContext = {},
): Promise<ConnectedDomainToolResult> {
  const input = asRecord(args)
  const tenantId = getTenantId(context)
  const action = normalizeAction(input.action)
  const resource = normalizeResource(input.resource)
  const provider = toText(input.provider) || null
  const filters = { ...asRecord(input.params), ...asRecord(input.filters) }
  const limit = toPositiveInt(input.limit ?? filters.limit, 50)
  const includeProviderFields = Boolean(input.include_provider_fields)
  const id = toText(input.id ?? filters.id)

  if ((action === 'ler' || action === 'ler_live') && !id) {
    throw new DomainAdapterError(`id e obrigatorio para social/action=${action}`, {
      code: 'social_missing_id',
    })
  }

  const connections = (
    await listIntegrationConnections({
      tenantId,
      domain: 'social',
      provider: provider || undefined,
      limit: 50,
    })
  ).filter((connection) => ACTIVE_CONNECTION_STATUSES.has(connection.status))

  if (!connections.length) {
    return {
      success: false,
      tool: 'social',
      action,
      resource,
      title: `social - ${resource}`,
      rows: [],
      columns: [],
      count: 0,
      providers: [],
      errors: [
        provider
          ? `Nenhuma conexao social ativa encontrada para provider ${provider}.`
          : 'Nenhuma conexao social ativa encontrada para este tenant.',
      ],
    }
  }

  const rows: ConnectedDomainRecord[] = []
  const providers: ConnectedDomainProviderStatus[] = []
  const warnings: string[] = []
  const errors: string[] = []

  for (const connection of connections) {
    const permissions = await getIntegrationPluginPermissions(connection.id, tenantId)
    if (!permissions?.enabled) {
      const error = `MCP nao esta habilitado para a conexao ${connection.displayName}.`
      providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }

    if (action === 'listar_live' || action === 'ler_live') {
      const apiAdapter = getSocialApiAdapter(connection.provider)
      if (!apiAdapter) {
        const error = `Provider social sem adapter API live registrado: ${connection.provider}. Registrados: ${listSocialApiAdapterProviders().join(', ') || 'nenhum'}.`
        providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, error))
        errors.push(error)
        continue
      }
      if (!apiAdapter.supportsLiveRead(resource)) {
        const error = `Provider ${connection.provider} nao suporta leitura live de ${resource}.`
        providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, error))
        errors.push(error)
        continue
      }

      try {
        const result = action === 'listar_live'
          ? await apiAdapter.listLive({ tenantId, connection, resource, filters, limit, includeProviderFields })
          : await apiAdapter.readLive({ tenantId, connection, resource, filters, limit, includeProviderFields, id })
        rows.push(...result.rows)
        warnings.push(...(result.warnings || []))
        providers.push(providerStatus(connection.provider, connection.id, connection.displayName, true))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido no adapter API social.'
        providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, message))
        errors.push(message)
      }
      continue
    }

    const adapter = getSocialAdapter(connection.provider)
    if (!adapter) {
      const error = `Provider social sem adapter registrado: ${connection.provider}. Registrados: ${listSocialAdapterProviders().join(', ')}.`
      providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }
    if (!adapter.supports(resource, action)) {
      const error = `Provider ${connection.provider} nao suporta ${resource}/${action} em social.`
      providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, error))
      errors.push(error)
      continue
    }

    try {
      const result = action === 'listar'
        ? await adapter.list({ tenantId, connection, resource, filters, limit, includeProviderFields })
        : await adapter.read({ tenantId, connection, resource, filters, limit, includeProviderFields, id })
      rows.push(...result.rows)
      warnings.push(...(result.warnings || []))
      providers.push(providerStatus(connection.provider, connection.id, connection.displayName, true))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no adapter social.'
      providers.push(providerStatus(connection.provider, connection.id, connection.displayName, false, message))
      errors.push(message)
    }
  }

  return {
    success: errors.length === 0,
    tool: 'social',
    action,
    resource,
    title: `social - ${resource}`,
    rows,
    columns: rows.length ? Object.keys(rows[0]) : [],
    count: rows.length,
    providers,
    ...(errors.length ? { errors } : {}),
    ...(warnings.length ? { warnings } : {}),
  }
}
