import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

const RESOURCE_TABLES: Record<string, NormalizedTableName> = {
  accounts: 'analytics_accounts',
  locations: 'analytics_locations',
  traffic_daily: 'analytics_traffic_daily',
  pages_daily: 'analytics_pages_daily',
  queries_daily: 'analytics_queries_daily',
  events_daily: 'analytics_events_daily',
  reviews: 'analytics_reviews',
  local_posts: 'analytics_local_posts',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function unwrapPayload(row: JsonRecord): JsonRecord {
  const payload = row.raw_payload ?? row.rawPayload ?? row.payload ?? row.source_payload ?? row.raw
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as unknown
      return isRecord(parsed) ? unwrapPayload(parsed) : {}
    } catch {
      return {}
    }
  }
  if (!isRecord(payload)) return row
  return isRecord(payload.raw) ? payload.raw : payload
}

function nestedValue(row: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) return undefined
    return current[part]
  }, row)
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (isRecord(value)) {
      const translated = value.displayName ?? value.name ?? value.title ?? value.value ?? value.id
      if (translated != null) return String(translated)
    }
  }
  return null
}

function numberValue(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    const parsed = typeof value === 'string'
      ? Number(value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, ''))
      : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function dateValue(value: string | null) {
  if (!value) return null
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toISOString().slice(0, 10)
}

function timestampValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function ga4Value(row: JsonRecord, section: 'dimensionValues' | 'metricValues', index: number) {
  const values = row[section]
  if (!Array.isArray(values)) return null
  const value = values[index]
  return isRecord(value) ? text(value, ['value']) : null
}

function gscKey(row: JsonRecord, index: number) {
  const keys = row.keys
  if (!Array.isArray(keys)) return null
  const value = keys[index]
  return value == null ? null : String(value)
}

function firstRecord(value: unknown) {
  if (Array.isArray(value)) return value.find(isRecord)
  return isRecord(value) ? value : undefined
}

function externalId(row: JsonRecord, payload: JsonRecord, index: number) {
  return text(row, ['external_id', 'id'])
    || text(payload, ['id', 'name', 'resourceName', 'siteUrl', 'reviewId', 'localPostId'])
    || ga4Value(payload, 'dimensionValues', 0)
    || gscKey(payload, 0)
    || `analytics_${index + 1}`
}

function base(input: NormalizationInput, row: JsonRecord, payload: JsonRecord, index: number) {
  return {
    tenant_id: input.tenantId,
    connection_id: input.connectionId,
    provider: input.provider,
    resource: input.resource,
    external_id: externalId(row, payload, index),
    source_run_id: input.runId || null,
    source_table: input.sourceTable,
    synced_at: new Date().toISOString(),
    normalized_at: new Date().toISOString(),
    source_payload: payload,
  }
}

function accountFields(input: NormalizationInput, payload: JsonRecord) {
  return {
    account_id: text(payload, ['account_id', 'accountId', 'name']),
    property_id: text(payload, ['property_id', 'propertyId']) || (input.provider === 'google_analytics_4' ? text(payload, ['name']) : null),
    site_url: text(payload, ['siteUrl']),
    nome: text(payload, ['displayName', 'name', 'siteUrl']),
    tipo: text(payload, ['type', 'permissionLevel']),
    status: text(payload, ['state', 'status']),
    currency: text(payload, ['currencyCode']),
    timezone: text(payload, ['timeZone']),
  }
}

function locationFields(payload: JsonRecord) {
  const address: JsonRecord = isRecord(payload.storefrontAddress) ? payload.storefrontAddress : {}
  const category: JsonRecord = isRecord(payload.primaryCategory) ? payload.primaryCategory : {}
  const phoneNumbers: JsonRecord = isRecord(payload.phoneNumbers) ? payload.phoneNumbers : {}
  return {
    account_id: text(payload, ['account_id']),
    location_id: text(payload, ['name', 'location_id']),
    nome: text(payload, ['title', 'name']),
    store_code: text(payload, ['storeCode']),
    telefone: text(phoneNumbers, ['primaryPhone']),
    categoria: text(category, ['displayName', 'name']),
    endereco: Array.isArray(address.addressLines) ? address.addressLines.join(', ') : text(address, ['addressLines']),
    cidade: text(address, ['locality']),
    uf: text(address, ['administrativeArea']),
    pais: text(address, ['regionCode']),
    website_url: text(payload, ['websiteUri']),
    status: text(payload, ['metadata.hasGoogleUpdated', 'metadata.hasPendingEdits']),
  }
}

function trafficFields(input: NormalizationInput, payload: JsonRecord) {
  if (input.provider === 'google_analytics_4') {
    return {
      data_ref: dateValue(ga4Value(payload, 'dimensionValues', 0)),
      property_id: text(payload, ['property_id']),
      site_url: null,
      location_id: null,
      channel: null,
      page_url: null,
      query: null,
      event_name: null,
      metric: null,
      value: null,
      active_users: numberValue({ value: ga4Value(payload, 'metricValues', 0) }, ['value']),
      total_users: numberValue({ value: ga4Value(payload, 'metricValues', 1) }, ['value']),
      sessions: numberValue({ value: ga4Value(payload, 'metricValues', 2) }, ['value']),
      pageviews: numberValue({ value: ga4Value(payload, 'metricValues', 3) }, ['value']),
      events: null,
      conversions: numberValue({ value: ga4Value(payload, 'metricValues', 4) }, ['value']),
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
    }
  }
  if (input.provider === 'google_search_console') {
    return {
      data_ref: dateValue(gscKey(payload, 0)),
      property_id: null,
      site_url: text(payload, ['site_url']),
      location_id: null,
      channel: 'organic_search',
      page_url: null,
      query: null,
      event_name: null,
      metric: null,
      value: null,
      active_users: null,
      total_users: null,
      sessions: null,
      pageviews: null,
      events: null,
      conversions: null,
      clicks: numberValue(payload, ['clicks']),
      impressions: numberValue(payload, ['impressions']),
      ctr: numberValue(payload, ['ctr']),
      position: numberValue(payload, ['position']),
    }
  }
  const series = firstRecord(payload.dailyMetricTimeSeries) || firstRecord(payload.timeSeries) || payload
  const datedValue: JsonRecord = firstRecord(series.datedValues) || {}
  const dateRecord = isRecord(datedValue.date) ? datedValue.date : null
  const date = dateRecord
    ? `${dateRecord.year}-${String(dateRecord.month).padStart(2, '0')}-${String(dateRecord.day).padStart(2, '0')}`
    : text(payload, ['date'])
  return {
    data_ref: dateValue(date),
    property_id: null,
    site_url: null,
    location_id: text(payload, ['location', 'location_id']),
    channel: 'google_business_profile',
    page_url: null,
    query: null,
    event_name: null,
    metric: text(series as JsonRecord, ['dailyMetric', 'metric']) || text(payload, ['dailyMetric', 'metric']),
    value: numberValue(datedValue, ['value']) ?? numberValue(payload, ['value']),
    active_users: null,
    total_users: null,
    sessions: null,
    pageviews: null,
    events: null,
    conversions: null,
    clicks: null,
    impressions: null,
    ctr: null,
    position: null,
  }
}

function pageFields(input: NormalizationInput, payload: JsonRecord) {
  if (input.provider === 'google_analytics_4') {
    return {
      ...trafficFields(input, payload),
      page_url: ga4Value(payload, 'dimensionValues', 1),
      active_users: numberValue({ value: ga4Value(payload, 'metricValues', 1) }, ['value']),
      sessions: numberValue({ value: ga4Value(payload, 'metricValues', 2) }, ['value']),
      pageviews: numberValue({ value: ga4Value(payload, 'metricValues', 0) }, ['value']),
      conversions: null,
    }
  }
  return {
    ...trafficFields(input, payload),
    page_url: gscKey(payload, 1),
  }
}

function queryFields(payload: JsonRecord) {
  return {
    ...trafficFields({ provider: 'google_search_console' } as NormalizationInput, payload),
    query: gscKey(payload, 1),
  }
}

function eventFields(payload: JsonRecord) {
  return {
    data_ref: dateValue(ga4Value(payload, 'dimensionValues', 0)),
    property_id: text(payload, ['property_id']),
    site_url: null,
    location_id: null,
    channel: null,
    page_url: null,
    query: null,
    event_name: ga4Value(payload, 'dimensionValues', 1),
    metric: null,
    value: null,
    active_users: null,
    total_users: numberValue({ value: ga4Value(payload, 'metricValues', 1) }, ['value']),
    sessions: null,
    pageviews: null,
    events: numberValue({ value: ga4Value(payload, 'metricValues', 0) }, ['value']),
    conversions: null,
    clicks: null,
    impressions: null,
    ctr: null,
    position: null,
  }
}

function reviewFields(payload: JsonRecord) {
  const reply: JsonRecord = isRecord(payload.reviewReply) ? payload.reviewReply : {}
  const reviewer: JsonRecord = isRecord(payload.reviewer) ? payload.reviewer : {}
  return {
    review_id: text(payload, ['reviewId', 'name']),
    location_id: text(payload, ['location_id']),
    author_name: text(reviewer, ['displayName', 'name']),
    rating: text(payload, ['starRating']),
    comment: text(payload, ['comment']),
    reply_comment: text(reply, ['comment']),
    created_at: timestampValue(payload, ['createTime']),
    updated_at: timestampValue(payload, ['updateTime']),
    status: text(payload, ['state']),
  }
}

function localPostFields(payload: JsonRecord) {
  const callToAction: JsonRecord = isRecord(payload.callToAction) ? payload.callToAction : {}
  return {
    post_id: text(payload, ['localPostId', 'name']),
    location_id: text(payload, ['location_id']),
    titulo: text(payload, ['summary']),
    texto: text(payload, ['summary']),
    tipo: text(payload, ['topicType']),
    status: text(payload, ['state']),
    url: text(callToAction, ['url']),
    created_at: timestampValue(payload, ['createTime']),
    updated_at: timestampValue(payload, ['updateTime']),
  }
}

function fieldsFor(input: NormalizationInput, table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'analytics_accounts') return accountFields(input, payload)
  if (table === 'analytics_locations') return locationFields(payload)
  if (table === 'analytics_traffic_daily') return trafficFields(input, payload)
  if (table === 'analytics_pages_daily') return pageFields(input, payload)
  if (table === 'analytics_queries_daily') return queryFields(payload)
  if (table === 'analytics_events_daily') return eventFields(payload)
  if (table === 'analytics_reviews') return reviewFields(payload)
  return localPostFields(payload)
}

export function normalizeAnalyticsRows(input: NormalizationInput): NormalizationResult {
  const table = RESOURCE_TABLES[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso analytics ${input.resource} nao possui tabela normalized v1.`,
    }
  }

  const rows: NormalizedRow[] = input.rows.map((row, index) => {
    const payload = unwrapPayload(row)
    const id = externalId(row, payload, index)
    return {
      table,
      insertId: `${input.connectionId}:${input.provider}:${input.resource}:${id}`,
      data: {
        ...base(input, row, payload, index),
        ...fieldsFor(input, table, payload),
      },
    }
  })

  return {
    provider: input.provider,
    resource: input.resource,
    status: 'normalized',
    tables: [table],
    rows,
    skippedRows: 0,
  }
}
