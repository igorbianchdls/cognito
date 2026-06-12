import type { BigQuery } from '@google-cloud/bigquery'

import {
  createBigQueryClient,
  getBigQueryProjectId,
} from '@/lib/bigqueryClient'
import {
  getIntegrationBigQueryDestinationForConnection,
  getIntegrationPluginPermissions,
} from '@/products/integracoes/server/integrationConnectionRepository'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import { DomainAdapterError } from '@/products/plugin/server/domain-adapters/shared/adapterErrors'

type JsonRecord = Record<string, unknown>

export type ConnectedBigQueryResourceConfig<Resource extends string> = {
  resource: Resource
  providerResource: string
  table?: string
  dataset?: string
  dateField?: string
  statusField?: string
  orderBy?: 'synced_at' | 'date_field'
}

type ReadInput<Resource extends string> =
  | ConnectedDomainAdapterInput<Resource>
  | ConnectedDomainAdapterReadInput<Resource>

let bigQueryClient: BigQuery | null = null

function getBigQueryClient() {
  if (!bigQueryClient) {
    bigQueryClient = createBigQueryClient()
  }
  return bigQueryClient
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function asRecord(value: unknown): JsonRecord {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function formatBigQueryValue(value: unknown) {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as JsonRecord
    if (typeof record.value === 'string') return record.value
  }
  return String(value)
}

function normalizeBigQueryIdentifier(value: string, label: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (!/^[a-z_][a-z0-9_]{0,1023}$/.test(normalized)) {
    throw new DomainAdapterError(`${label} BigQuery invalido: ${value}`, {
      code: 'connected_bigquery_invalid_identifier',
      details: { label, value },
    })
  }
  return normalized
}

function normalizeProjectId(value: string) {
  const projectId = value.trim()
  if (!/^[a-z0-9][a-z0-9-_.]{0,254}$/i.test(projectId)) {
    throw new DomainAdapterError(`projectId BigQuery invalido: ${value}`, {
      code: 'connected_bigquery_invalid_project',
      details: { value },
    })
  }
  return projectId
}

async function getDataset<Resource extends string>(
  input: ReadInput<Resource>,
  config: ConnectedBigQueryResourceConfig<Resource>,
) {
  const destination = await getIntegrationBigQueryDestinationForConnection(input.connection.id, input.tenantId)
  const destinationConfig = asRecord(destination?.config)
  const tenantDatasets = getTenantBigQueryDatasets(input.tenantId)

  return normalizeBigQueryIdentifier(
    config.dataset
      || toText(destinationConfig.rawDataset)
      || toText(destinationConfig.raw_dataset)
      || toText(destinationConfig.dataset)
      || tenantDatasets.rawDataset
      || process.env.PLUGIN_BIGQUERY_DATASET
      || process.env.MCP_APPS_BIGQUERY_DATASET
      || process.env.BIGQUERY_CUSTOM_RAW_DATASET
      || 'integrations_custom_raw',
    'dataset',
  )
}

function getTable(provider: string, config: ConnectedBigQueryResourceConfig<string>) {
  return normalizeBigQueryIdentifier(config.table || `${provider}_${config.providerResource}`, 'table')
}

function hasSelectedResource(selectedResources: string[], providerResource: string) {
  if (!selectedResources.length) return true
  return selectedResources.includes(providerResource)
}

function hasReadPermission(readResources: string[], resource: string, providerResource: string) {
  if (!readResources.length) return false
  return readResources.includes(resource) || readResources.includes(providerResource) || readResources.includes('*')
}

function getRawPayload(row: JsonRecord) {
  return asRecord(row.raw_payload ?? row.rawPayload ?? row.payload)
}

function getPayloadFields(payload: JsonRecord) {
  const raw = asRecord(payload.raw)
  return Object.keys(raw).length ? raw : payload
}

function getJsonValueExpression(path: string) {
  const escapedPath = path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return [
    `JSON_VALUE(raw_payload, '$.${escapedPath}')`,
    `JSON_VALUE(raw_payload, '$.raw.${escapedPath}')`,
  ]
}

function buildOptionalDateFilter(field: string, operator: '>=' | '<=', paramName: string) {
  const [payloadField, rawField] = getJsonValueExpression(field)
  return `(
    SAFE_CAST(${payloadField} AS DATE) ${operator} @${paramName}
    OR SAFE_CAST(${rawField} AS DATE) ${operator} @${paramName}
  )`
}

function buildOptionalStatusFilter(field: string) {
  const [payloadField, rawField] = getJsonValueExpression(field)
  return `LOWER(COALESCE(${payloadField}, ${rawField}, '')) = LOWER(@status)`
}

function buildOrderBy(config: ConnectedBigQueryResourceConfig<string>) {
  if (config.orderBy === 'date_field' && config.dateField) {
    const [payloadField, rawField] = getJsonValueExpression(config.dateField)
    return `COALESCE(SAFE_CAST(${payloadField} AS TIMESTAMP), SAFE_CAST(${rawField} AS TIMESTAMP), synced_at) DESC`
  }
  return 'synced_at DESC'
}

function toCanonicalRecord<Resource extends string>(
  provider: string,
  resource: Resource,
  row: JsonRecord,
  includeProviderFields: boolean,
): ConnectedDomainRecord {
  const payload = getRawPayload(row)
  const payloadFields = getPayloadFields(payload)
  const externalId = toText(row.external_id ?? payload.external_id ?? payloadFields.external_id ?? payloadFields.id)
  const fields = {
    ...payloadFields,
    external_id: externalId || null,
    synced_at: formatBigQueryValue(row.synced_at),
    run_id: row.run_id == null ? null : String(row.run_id),
  }

  return {
    id: externalId || toText(row.insert_id) || toText(row.run_id),
    provider,
    provider_id: externalId,
    resource,
    fields,
    ...(includeProviderFields ? { provider_fields: { ...row, raw_payload: payload } } : {}),
  }
}

export async function readConnectedBigQueryResource<Resource extends string>(
  action: ConnectedDomainAction,
  input: ReadInput<Resource>,
  config: ConnectedBigQueryResourceConfig<Resource>,
): Promise<ConnectedDomainAdapterResult> {
  if (!hasSelectedResource(input.connection.selectedResources, config.providerResource)) {
    throw new DomainAdapterError(
      `Recurso ${config.providerResource} nao esta habilitado na conexao ${input.connection.displayName}.`,
      {
        code: 'connected_bigquery_resource_not_selected',
        details: {
          provider: input.connection.provider,
          connectionId: input.connection.id,
          resource: config.resource,
          providerResource: config.providerResource,
        },
      },
    )
  }
  const permissions = await getIntegrationPluginPermissions(input.connection.id, input.tenantId)
  if (!permissions?.enabled || !hasReadPermission(permissions.readResources, config.resource, config.providerResource)) {
    throw new DomainAdapterError(
      `MCP nao tem permissao de leitura para ${config.providerResource} na conexao ${input.connection.displayName}.`,
      {
        code: 'connected_bigquery_resource_not_permitted',
        details: {
          provider: input.connection.provider,
          connectionId: input.connection.id,
          resource: config.resource,
          providerResource: config.providerResource,
        },
      },
    )
  }

  const projectId = normalizeProjectId(getBigQueryProjectId('creatto-463117') || 'creatto-463117')
  const dataset = await getDataset(input, config)
  const table = getTable(input.connection.provider, config)
  const fullTable = `\`${projectId}.${dataset}.${table}\``
  const params: JsonRecord = {
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: input.connection.provider,
    resource: config.providerResource,
    limit: input.limit,
  }
  const where = [
    'tenant_id = @tenantId',
    'connection_id = @connectionId',
    'provider = @provider',
    'resource = @resource',
  ]

  const id = 'id' in input ? toText(input.id) : toText(input.filters.id)
  if (action === 'ler' || id) {
    if (!id) {
      throw new DomainAdapterError('id e obrigatorio para action=ler.', {
        code: 'connected_bigquery_missing_id',
      })
    }
    params.id = id
    where.push(`(
      external_id = @id
      OR JSON_VALUE(raw_payload, '$.external_id') = @id
      OR JSON_VALUE(raw_payload, '$.id') = @id
      OR JSON_VALUE(raw_payload, '$.raw.id') = @id
    )`)
  }

  const q = toText(input.filters.q)
  if (q) {
    params.q = `%${q.toLowerCase()}%`
    where.push('LOWER(TO_JSON_STRING(raw_payload)) LIKE @q')
  }

  const status = toText(input.filters.status)
  if (status && config.statusField) {
    params.status = status
    where.push(buildOptionalStatusFilter(config.statusField))
  }

  const de = toText(input.filters.de)
  if (de && config.dateField) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(de)) throw new DomainAdapterError(`Data invalida: ${de}. Use YYYY-MM-DD.`)
    params.dateFrom = de
    where.push(buildOptionalDateFilter(config.dateField, '>=', 'dateFrom'))
  }

  const ate = toText(input.filters.ate)
  if (ate && config.dateField) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ate)) throw new DomainAdapterError(`Data invalida: ${ate}. Use YYYY-MM-DD.`)
    params.dateTo = ate
    where.push(buildOptionalDateFilter(config.dateField, '<=', 'dateTo'))
  }

  let rows: unknown[]
  try {
    const [queryRows] = await getBigQueryClient().query({
      query: `
SELECT
  tenant_id,
  connection_id,
  provider,
  resource,
  run_id,
  external_id,
  synced_at,
  raw_payload
FROM ${fullTable}
WHERE ${where.join(' AND ')}
ORDER BY ${buildOrderBy(config)}
LIMIT @limit
    `.trim(),
      params,
    })
    rows = queryRows
  } catch (error) {
    const errorRecord = asRecord(error)
    const message = toText(errorRecord.message)
    const code = toText(errorRecord.code)
    if (code === '404' || /not found/i.test(message)) {
      return {
        rows: [],
        columns: [],
        count: 0,
        warnings: [`Tabela BigQuery sem dados sincronizados: ${dataset}.${table}.`],
      }
    }
    throw error
  }

  const canonicalRows = (rows as JsonRecord[]).map((row) => (
    toCanonicalRecord(input.connection.provider, config.resource, row, input.includeProviderFields)
  ))

  return {
    rows: canonicalRows,
    columns: canonicalRows.length ? Object.keys(canonicalRows[0]) : [],
    count: canonicalRows.length,
  }
}
