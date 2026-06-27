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
  datasetKind?: 'raw' | 'normalized'
  dateField?: string
  statusField?: string
  orderBy?: 'synced_at' | 'date_field'
  defaultMetricField?: string
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

function toBoolean(value: unknown) {
  const normalized = toText(value).toLowerCase()
  if (['1', 'true', 'sim', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'nao', 'não', 'no', 'off'].includes(normalized)) return false
  return false
}

function firstText(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = toText(record[key])
    if (value) return value
  }
  return ''
}

function normalizeDateValue(value: unknown, label: string) {
  const raw = toText(value)
  if (!raw) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new DomainAdapterError(`Data invalida em ${label}: ${raw}. Use YYYY-MM-DD.`, {
      code: 'connected_bigquery_invalid_date',
      details: { label, value: raw },
    })
  }
  return raw
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
      || (config.datasetKind === 'normalized'
        ? toText(destinationConfig.normalizedDataset) || toText(destinationConfig.normalized_dataset) || tenantDatasets.normalizedDataset
        : toText(destinationConfig.rawDataset) || toText(destinationConfig.raw_dataset) || toText(destinationConfig.dataset) || tenantDatasets.rawDataset)
      || process.env.PLUGIN_BIGQUERY_DATASET
      || process.env.MCP_APPS_BIGQUERY_DATASET
      || process.env.BIGQUERY_CUSTOM_RAW_DATASET
      || 'integrations_custom_raw',
    'dataset',
  )
}

function getTable(provider: string, config: ConnectedBigQueryResourceConfig<string>) {
  const table = config.table || (config.datasetKind === 'normalized' ? config.providerResource : `${provider}_${config.providerResource}`)
  return normalizeBigQueryIdentifier(table, 'table')
}

function hasSelectedResource(selectedResources: string[], providerResource: string) {
  if (!selectedResources.length) return true
  return selectedResources.includes(providerResource)
}

function hasReadPermission(readResources: string[], resource: string, providerResource: string) {
  if (!readResources.length) return false
  return readResources.includes('*') || readResources.includes(resource) || readResources.includes(providerResource)
}

function getRawPayload(row: JsonRecord) {
  return asRecord(row.source_payload ?? row.raw_payload ?? row.rawPayload ?? row.payload)
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

function getColumnExpression(field: string) {
  return normalizeBigQueryIdentifier(field, 'field')
}

function getDateExpression(config: ConnectedBigQueryResourceConfig<string>, field: string) {
  if (config.datasetKind === 'normalized') {
    return `SAFE_CAST(${getColumnExpression(field)} AS DATE)`
  }

  const [payloadField, rawField] = getJsonValueExpression(field)
  return `COALESCE(SAFE_CAST(${payloadField} AS DATE), SAFE_CAST(${rawField} AS DATE))`
}

function buildOptionalDateFilter(config: ConnectedBigQueryResourceConfig<string>, field: string, operator: '>=' | '<=', paramName: string) {
  return `${getDateExpression(config, field)} ${operator} @${paramName}`
}

function buildOptionalStatusFilter(config: ConnectedBigQueryResourceConfig<string>, field: string) {
  if (config.datasetKind === 'normalized') {
    return `LOWER(COALESCE(CAST(${getColumnExpression(field)} AS STRING), '')) = LOWER(@status)`
  }

  const [payloadField, rawField] = getJsonValueExpression(field)
  return `LOWER(COALESCE(${payloadField}, ${rawField}, '')) = LOWER(@status)`
}

function buildOrderBy(config: ConnectedBigQueryResourceConfig<string>) {
  if (config.orderBy === 'date_field' && config.dateField) {
    if (config.datasetKind === 'normalized') {
      return `COALESCE(SAFE_CAST(${getColumnExpression(config.dateField)} AS TIMESTAMP), synced_at) DESC, normalized_at DESC, synced_at DESC`
    }

    const [payloadField, rawField] = getJsonValueExpression(config.dateField)
    return `COALESCE(SAFE_CAST(${payloadField} AS TIMESTAMP), SAFE_CAST(${rawField} AS TIMESTAMP), synced_at) DESC, synced_at DESC`
  }
  return config.datasetKind === 'normalized' ? 'normalized_at DESC, synced_at DESC' : 'synced_at DESC'
}

function buildRequestedOrderBy(config: ConnectedBigQueryResourceConfig<string>, filters: JsonRecord) {
  const sortBy = firstText(filters, ['sort_by', 'order_by'])
  if (!sortBy) return buildOrderBy(config)
  const direction = firstText(filters, ['sort_dir', 'order_dir']).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  if (sortBy === 'data' || sortBy === 'date') {
    const field = firstText(filters, ['date_field', 'data_campo']) || config.dateField
    if (field) return `${getDateExpression(config, field)} ${direction}, ${buildOrderBy(config)}`
  }
  return `${getColumnExpression(sortBy)} ${direction}, ${buildOrderBy(config)}`
}

function getPartitionId(config: ConnectedBigQueryResourceConfig<string>) {
  return config.datasetKind === 'normalized'
    ? 'COALESCE(external_id, TO_JSON_STRING(source_payload))'
    : 'COALESCE(external_id, TO_JSON_STRING(raw_payload))'
}

function getSelect(config: ConnectedBigQueryResourceConfig<string>) {
  return config.datasetKind === 'normalized'
    ? '*'
    : `
  tenant_id,
  connection_id,
  provider,
  resource,
  run_id,
  external_id,
  synced_at,
  raw_payload`
}

function requestedDateField(config: ConnectedBigQueryResourceConfig<string>, filters: JsonRecord) {
  return firstText(filters, ['date_field', 'data_campo']) || config.dateField || ''
}

function isAggregateRequest(filters: JsonRecord) {
  const mode = firstText(filters, ['mode', 'modo']).toLowerCase()
  return mode === 'aggregate' || mode === 'agregar' || toBoolean(filters.aggregate)
}

function parseList(value: unknown) {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean)
  return toText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function defaultMetricField(config: ConnectedBigQueryResourceConfig<string>, filters: JsonRecord) {
  return firstText(filters, ['value_field', 'valor_campo', 'metric_field'])
    || config.defaultMetricField
    || 'valor_total'
}

function metricExpression(operation: string, field: string) {
  const normalizedOperation = operation.toLowerCase()
  if (normalizedOperation === 'count') return 'COUNT(*)'
  const value = `SAFE_CAST(${getColumnExpression(field)} AS FLOAT64)`
  if (normalizedOperation === 'avg' || normalizedOperation === 'media') return `AVG(${value})`
  if (normalizedOperation === 'min') return `MIN(${value})`
  if (normalizedOperation === 'max') return `MAX(${value})`
  return `SUM(${value})`
}

function parseMetrics(config: ConnectedBigQueryResourceConfig<string>, filters: JsonRecord) {
  const metrics = filters.metrics
  if (Array.isArray(metrics) && metrics.length) {
    return metrics
      .map((metric, index) => {
        const record = asRecord(metric)
        const operation = firstText(record, ['operation', 'op', 'metric']) || 'sum'
        const field = firstText(record, ['field', 'value_field', 'valor_campo']) || defaultMetricField(config, filters)
        const name = firstText(record, ['name', 'alias']) || `${operation}_${operation === 'count' ? 'registros' : field}`
        return {
          name: normalizeBigQueryIdentifier(name || `metric_${index + 1}`, 'metric'),
          expression: metricExpression(operation, field),
        }
      })
  }

  const operation = firstText(filters, ['metric', 'operation', 'op']) || 'sum'
  const field = defaultMetricField(config, filters)
  const name = operation.toLowerCase() === 'count' ? 'count' : `${operation}_${field}`
  return [{
    name: normalizeBigQueryIdentifier(name, 'metric'),
    expression: metricExpression(operation, field),
  }]
}

function buildGroupExpression(config: ConnectedBigQueryResourceConfig<string>, group: string, filters: JsonRecord) {
  const normalized = group.trim().toLowerCase()
  const dateField = requestedDateField(config, filters)
  if (['day', 'dia'].includes(normalized) && dateField) {
    return { name: 'day', expression: `FORMAT_DATE('%Y-%m-%d', ${getDateExpression(config, dateField)})` }
  }
  if (['week', 'semana'].includes(normalized) && dateField) {
    return { name: 'week', expression: `FORMAT_DATE('%G-W%V', ${getDateExpression(config, dateField)})` }
  }
  if (['month', 'mes', 'mês'].includes(normalized) && dateField) {
    return { name: 'month', expression: `FORMAT_DATE('%Y-%m', ${getDateExpression(config, dateField)})` }
  }
  if (['year', 'ano'].includes(normalized) && dateField) {
    return { name: 'year', expression: `FORMAT_DATE('%Y', ${getDateExpression(config, dateField)})` }
  }

  const field = getColumnExpression(group)
  return {
    name: normalizeBigQueryIdentifier(group, 'group_by'),
    expression: `CAST(${field} AS STRING)`,
  }
}

function getAggregateGroups(config: ConnectedBigQueryResourceConfig<string>, filters: JsonRecord) {
  const groupBy = parseList(filters.group_by ?? filters.groupBy)
  const granularity = firstText(filters, ['granularity', 'periodo'])
  const groups = groupBy.length ? groupBy : (granularity ? [granularity] : [])
  return groups.map((group) => buildGroupExpression(config, group, filters))
}

function aggregateRecord<Resource extends string>(
  provider: string,
  resource: Resource,
  row: JsonRecord,
  index: number,
): ConnectedDomainRecord {
  return {
    id: `aggregate:${resource}:${index + 1}`,
    provider,
    provider_id: '',
    resource,
    fields: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, formatBigQueryValue(value)])),
  }
}

function bigQueryFieldError(error: unknown, dataset: string, table: string) {
  const errorRecord = asRecord(error)
  const message = toText(errorRecord.message) || String(error)
  const fieldMatch = message.match(/Unrecognized name:\s*([A-Za-z_][A-Za-z0-9_]*)/i)
  if (!fieldMatch) return null
  return new DomainAdapterError(
    `Campo BigQuery nao encontrado em ${dataset}.${table}: ${fieldMatch[1]}. Ajuste filters/sort_by/group_by/value_field para uma coluna existente na tabela normalizada.`,
    {
      code: 'connected_bigquery_unknown_field',
      details: {
        dataset,
        table,
        field: fieldMatch[1],
        originalMessage: message,
      },
    },
  )
}

function getRunId(row: JsonRecord) {
  return row.run_id == null && row.source_run_id == null ? null : String(row.run_id ?? row.source_run_id)
}

function getBusinessFields(row: JsonRecord) {
  const ignored = new Set([
    'tenant_id',
    'connection_id',
    'provider',
    'resource',
    'run_id',
    'source_run_id',
    'external_id',
    'synced_at',
    'normalized_at',
    'raw_payload',
    'rawPayload',
    'source_payload',
    'payload',
  ])
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => !ignored.has(key))
      .map(([key, value]) => [key, formatBigQueryValue(value)]),
  )
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
    ...getBusinessFields(row),
    external_id: externalId || null,
    synced_at: formatBigQueryValue(row.synced_at),
    run_id: getRunId(row),
  }

  return {
    id: externalId || toText(row.insert_id) || toText(row.run_id ?? row.source_run_id),
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
    where.push(config.datasetKind === 'normalized'
      ? `(
        external_id = @id
        OR JSON_VALUE(source_payload, '$.external_id') = @id
        OR JSON_VALUE(source_payload, '$.id') = @id
      )`
      : `(
        external_id = @id
        OR JSON_VALUE(raw_payload, '$.external_id') = @id
        OR JSON_VALUE(raw_payload, '$.id') = @id
        OR JSON_VALUE(raw_payload, '$.raw.id') = @id
      )`)
  }

  const q = toText(input.filters.q)
    || toText(input.filters.search)
    || toText(input.filters.query)
  if (q) {
    params.q = `%${q.toLowerCase()}%`
    where.push(config.datasetKind === 'normalized'
      ? 'LOWER(TO_JSON_STRING(source_payload)) LIKE @q'
      : 'LOWER(TO_JSON_STRING(raw_payload)) LIKE @q')
  }

  const status = toText(input.filters.status) || toText(input.filters.situacao)
  if (status && config.statusField) {
    params.status = status
    where.push(buildOptionalStatusFilter(config, config.statusField))
  }

  const dateField = requestedDateField(config, input.filters)
  const de = normalizeDateValue(
    input.filters.de ?? input.filters.date_from ?? input.filters.start_date,
    'de/date_from',
  )
  if (de && dateField) {
    params.dateFrom = de
    where.push(buildOptionalDateFilter(config, dateField, '>=', 'dateFrom'))
  }

  const ate = normalizeDateValue(
    input.filters.ate ?? input.filters.date_to ?? input.filters.end_date,
    'ate/date_to',
  )
  if (ate && dateField) {
    params.dateTo = ate
    where.push(buildOptionalDateFilter(config, dateField, '<=', 'dateTo'))
  }

  const minValue = toText(input.filters.valor_min ?? input.filters.min_value)
  const maxValue = toText(input.filters.valor_max ?? input.filters.max_value)
  if ((minValue || maxValue) && config.datasetKind === 'normalized') {
    const valueField = defaultMetricField(config, input.filters)
    if (minValue) {
      const numericMinValue = Number(minValue)
      if (!Number.isFinite(numericMinValue)) throw new DomainAdapterError(`valor_min invalido: ${minValue}`)
      params.valueMin = numericMinValue
      where.push(`SAFE_CAST(${getColumnExpression(valueField)} AS FLOAT64) >= @valueMin`)
    }
    if (maxValue) {
      const numericMaxValue = Number(maxValue)
      if (!Number.isFinite(numericMaxValue)) throw new DomainAdapterError(`valor_max invalido: ${maxValue}`)
      params.valueMax = numericMaxValue
      where.push(`SAFE_CAST(${getColumnExpression(valueField)} AS FLOAT64) <= @valueMax`)
    }
  }

  const exactFilterFields = [
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
  ]
  if (config.datasetKind === 'normalized') {
    for (const field of exactFilterFields) {
      const value = toText(input.filters[field])
      if (!value) continue
      const paramName = `filter_${field}`
      params[paramName] = value
      where.push(`CAST(${getColumnExpression(field)} AS STRING) = @${paramName}`)
    }
  }

  const select = getSelect(config)
  const partitionId = getPartitionId(config)
  const orderBy = buildRequestedOrderBy(config, input.filters)
  const aggregate = isAggregateRequest(input.filters)

  if (aggregate) {
    if (action === 'ler') {
      throw new DomainAdapterError('mode=aggregate deve ser usado com action=listar.', {
        code: 'connected_bigquery_invalid_aggregate_action',
      })
    }
    if (config.datasetKind !== 'normalized') {
      throw new DomainAdapterError('mode=aggregate exige tabela normalizada no BigQuery.', {
        code: 'connected_bigquery_aggregate_requires_normalized',
      })
    }

    const groups = getAggregateGroups(config, input.filters)
    const metrics = parseMetrics(config, input.filters)
    const groupSelect = groups.map((group) => `${group.expression} AS ${group.name}`)
    const metricSelect = metrics.map((metric) => `${metric.expression} AS ${metric.name}`)
    const groupBy = groups.length ? `GROUP BY ${groups.map((_, index) => String(index + 1)).join(', ')}` : ''
    const aggregateOrderBy = groups.length
      ? `ORDER BY ${groups.map((group) => group.name).join(', ')}`
      : `ORDER BY ${metrics[0]?.name || 'count'} DESC`

    let rows: unknown[]
    try {
      const [queryRows] = await getBigQueryClient().query({
        query: `
WITH latest AS (
  SELECT
    ${select}
  FROM ${fullTable}
  WHERE ${where.join(' AND ')}
  QUALIFY ROW_NUMBER() OVER (PARTITION BY ${partitionId} ORDER BY ${orderBy}) = 1
)
SELECT
  ${[...groupSelect, ...metricSelect].join(',\n  ')}
FROM latest
${groupBy}
${aggregateOrderBy}
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
      const fieldError = bigQueryFieldError(error, dataset, table)
      if (fieldError) throw fieldError
      throw error
    }

    const aggregateRows = (rows as JsonRecord[]).map((row, index) => (
      aggregateRecord(input.connection.provider, config.resource, row, index)
    ))

    return {
      rows: aggregateRows,
      columns: aggregateRows.length ? Object.keys(aggregateRows[0].fields) : [],
      count: aggregateRows.length,
      warnings: [
        `Consulta agregada em ${dataset}.${table}. Dados dependem da ultima sincronizacao do pipeline.`,
      ],
    }
  }

  let rows: unknown[]
  try {
    const [queryRows] = await getBigQueryClient().query({
      query: `
SELECT
  ${select}
FROM ${fullTable}
WHERE ${where.join(' AND ')}
QUALIFY ROW_NUMBER() OVER (PARTITION BY ${partitionId} ORDER BY ${orderBy}) = 1
ORDER BY ${orderBy}
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
    const fieldError = bigQueryFieldError(error, dataset, table)
    if (fieldError) throw fieldError
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
