import { runQuery } from '@/lib/postgres'
import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'
import { DomainAdapterError } from '@/products/mcp-apps/server/domain-adapters/shared/adapterErrors'

type JsonRecord = Record<string, unknown>
type TableColumns = Set<string>

export type ConnectedPostgresResourceConfig<Resource extends string> = {
  resource: Resource
  providerResource: string
  table: string
  dateColumn?: string
  statusColumn?: string
  orderBy?: string
}

type ReadInput<Resource extends string> =
  | ConnectedDomainAdapterInput<Resource>
  | ConnectedDomainAdapterReadInput<Resource>

const tableColumnsCache = new Map<string, Promise<TableColumns>>()

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function splitTableName(table: string) {
  const [schema, name] = table.split('.')
  if (!schema || !name || !/^[a-z_][a-z0-9_]*$/i.test(schema) || !/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new DomainAdapterError(`Tabela canonica invalida: ${table}`, {
      code: 'connected_adapter_invalid_table',
      details: { table },
    })
  }
  return { schema, name }
}

function getTableColumns(table: string) {
  const cached = tableColumnsCache.get(table)
  if (cached) return cached

  const { schema, name } = splitTableName(table)
  const promise = runQuery<{ column_name: string }>(
    `
SELECT column_name
FROM information_schema.columns
WHERE table_schema = $1::text
  AND table_name = $2::text
    `.trim(),
    [schema, name],
  ).then((rows) => new Set(rows.map((row) => row.column_name)))

  tableColumnsCache.set(table, promise)
  return promise
}

function normalizeDate(value: unknown) {
  const text = toText(value)
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new DomainAdapterError(`Data invalida: ${text}. Use YYYY-MM-DD.`, {
      code: 'connected_adapter_invalid_date',
      details: { value: text },
    })
  }
  return text
}

function hasSelectedResource(selectedResources: string[], providerResource: string) {
  if (!selectedResources.length) return true
  return selectedResources.includes(providerResource)
}

function toCanonicalRecord<Resource extends string>(
  provider: string,
  resource: Resource,
  row: JsonRecord,
  includeProviderFields: boolean,
): ConnectedDomainRecord {
  const id = toText(row.id ?? row.record_id ?? row.external_id)
  const providerId = toText(row.provider_id ?? row.external_id ?? row.record_id ?? row.id)
  const {
    tenant_id: _tenantId,
    connection_id: _connectionId,
    source_connection_id: _sourceConnectionId,
    provider: _provider,
    ...fields
  } = row

  return {
    id: id || providerId,
    provider,
    provider_id: providerId || id,
    resource,
    fields,
    ...(includeProviderFields ? { provider_fields: row } : {}),
  }
}

export async function readConnectedPostgresResource<Resource extends string>(
  action: ConnectedDomainAction,
  input: ReadInput<Resource>,
  config: ConnectedPostgresResourceConfig<Resource>,
): Promise<ConnectedDomainAdapterResult> {
  if (!hasSelectedResource(input.connection.selectedResources, config.providerResource)) {
    throw new DomainAdapterError(
      `Recurso ${config.providerResource} nao esta habilitado na conexao ${input.connection.displayName}.`,
      {
        code: 'connected_adapter_resource_not_selected',
        details: {
          provider: input.connection.provider,
          connectionId: input.connection.id,
          resource: config.resource,
          providerResource: config.providerResource,
        },
      },
    )
  }

  const params: unknown[] = [input.tenantId]
  const where = ['t.tenant_id = $1::int']
  const warnings: string[] = []
  const tableColumns = await getTableColumns(config.table)

  if (tableColumns.has('connection_id')) {
    params.push(input.connection.id)
    where.push(`t.connection_id::text = $${params.length}::text`)
  } else if (tableColumns.has('source_connection_id')) {
    params.push(input.connection.id)
    where.push(`t.source_connection_id::text = $${params.length}::text`)
  } else {
    warnings.push(`Tabela ${config.table} nao possui connection_id/source_connection_id; filtro ficou limitado a tenant/provider.`)
  }

  if (tableColumns.has('provider')) {
    params.push(input.connection.provider)
    where.push(`t.provider::text = $${params.length}::text`)
  } else {
    warnings.push(`Tabela ${config.table} nao possui provider; filtro ficou limitado a tenant/conexao quando disponivel.`)
  }

  const id = 'id' in input ? toText(input.id) : toText(input.filters.id)
  if (action === 'ler' || id) {
    if (!id) {
      throw new DomainAdapterError('id e obrigatorio para action=ler.', {
        code: 'connected_adapter_missing_id',
      })
    }
    params.push(id)
    where.push(`t.id::text = $${params.length}::text`)
  }

  const q = toText(input.filters.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`to_jsonb(t)::text ILIKE $${params.length}::text`)
  }

  const status = toText(input.filters.status)
  if (status && config.statusColumn) {
    params.push(status)
    where.push(`LOWER(COALESCE(t.${config.statusColumn}::text, '')) = LOWER($${params.length}::text)`)
  }

  const de = normalizeDate(input.filters.de)
  if (de && config.dateColumn) {
    params.push(de)
    where.push(`t.${config.dateColumn}::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(input.filters.ate)
  if (ate && config.dateColumn) {
    params.push(ate)
    where.push(`t.${config.dateColumn}::date <= $${params.length}::date`)
  }

  params.push(input.limit)
  const limitParam = params.length
  const orderBy = config.orderBy || 't.id DESC'
  const rows = await runQuery<JsonRecord>(
    `
SELECT t.*
FROM ${config.table} t
WHERE ${where.join(' AND ')}
ORDER BY ${orderBy}
LIMIT $${limitParam}::int
    `.trim(),
    params,
  )

  const canonicalRows = rows.map((row) => (
    toCanonicalRecord(input.connection.provider, config.resource, row, input.includeProviderFields)
  ))

  return {
    rows: canonicalRows,
    columns: canonicalRows.length ? Object.keys(canonicalRows[0]) : [],
    count: canonicalRows.length,
    ...(warnings.length ? { warnings } : {}),
  }
}
