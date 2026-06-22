import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

const RESOURCE_TABLES: Record<string, NormalizedTableName> = {
  accounts: 'paid_media_accounts',
  campaigns: 'paid_media_campaigns',
  ad_groups: 'paid_media_ad_groups',
  ads: 'paid_media_ads',
  creatives: 'paid_media_creatives',
  keywords: 'paid_media_keywords',
  conversions: 'paid_media_conversions',
  insights_campaign_daily: 'paid_media_insights_daily',
  insights_ad_daily: 'paid_media_insights_daily',
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

function microsValue(row: JsonRecord, keys: string[]) {
  const value = numberValue(row, keys)
  return value == null ? null : value / 1000000
}

function dateValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toISOString().slice(0, 10)
}

function timestampValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function actionMetric(payload: JsonRecord, names: string[]) {
  const actions = nestedValue(payload, 'actions')
  if (!Array.isArray(actions)) return null
  for (const action of actions) {
    if (!isRecord(action)) continue
    const type = text(action, ['action_type'])
    if (type && names.includes(type)) return numberValue(action, ['value'])
  }
  return null
}

function actionValue(payload: JsonRecord, names: string[]) {
  const values = nestedValue(payload, 'action_values')
  if (!Array.isArray(values)) return null
  for (const value of values) {
    if (!isRecord(value)) continue
    const type = text(value, ['action_type'])
    if (type && names.includes(type)) return numberValue(value, ['value'])
  }
  return null
}

function roasValue(payload: JsonRecord) {
  const roas = nestedValue(payload, 'purchase_roas')
  if (Array.isArray(roas)) {
    const first = roas.find(isRecord)
    if (first) return numberValue(first, ['value'])
  }
  return numberValue(payload, ['roas'])
}

function externalId(row: JsonRecord, payload: JsonRecord, index: number) {
  return text(row, ['external_id', 'id'])
    || text(payload, [
      'id',
      'resourceName',
      'resource_name',
      'value',
      'account_id',
      'campaign.id',
      'campaign_id',
      'adGroup.id',
      'ad_group.id',
      'ad_group_id',
      'adGroupAd.ad.id',
      'ad_group_ad.ad.id',
      'ad_id',
      'asset.id',
      'adGroupCriterion.criterionId',
      'ad_group_criterion.criterion_id',
      'conversionAction.id',
      'conversion_action.id',
      'date_start',
      'segments.date',
    ])
    || `paid_media_${index + 1}`
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

function accountFields(payload: JsonRecord) {
  return {
    account_id: text(payload, ['account_id', 'id', 'value', 'customer.id']),
    nome: text(payload, ['name', 'descriptiveName', 'customer.descriptiveName', 'value']),
    status: text(payload, ['account_status', 'status', 'customer.status']),
    currency: text(payload, ['currency', 'currency_code', 'customer.currencyCode']),
    timezone: text(payload, ['timezone_name', 'time_zone', 'customer.timeZone']),
  }
}

function entityFields(payload: JsonRecord) {
  return {
    account_id: text(payload, ['account_id', 'customer.id']),
    campaign_id: text(payload, ['campaign_id', 'campaign.id']),
    ad_group_id: text(payload, ['adset_id', 'ad_group_id', 'adGroup.id', 'ad_group.id']),
    ad_id: text(payload, ['ad_id', 'adGroupAd.ad.id', 'ad_group_ad.ad.id']),
    nome: text(payload, ['name', 'campaign.name', 'adGroup.name', 'ad_group.name', 'adGroupAd.ad.name', 'ad_group_ad.ad.name']),
    status: text(payload, ['effective_status', 'status', 'campaign.status', 'adGroup.status', 'ad_group.status', 'adGroupAd.status', 'ad_group_ad.status']),
    tipo: text(payload, ['type', 'objective', 'campaign.advertisingChannelType', 'campaign.advertising_channel_type']),
    objetivo: text(payload, ['objective', 'campaign.advertisingChannelType', 'campaign.advertising_channel_type']),
    orcamento: numberValue(payload, ['daily_budget', 'lifetime_budget', 'budget']) ?? microsValue(payload, ['campaignBudget.amountMicros']),
    criado_em: timestampValue(payload, ['created_time', 'createdAt']),
    atualizado_em: timestampValue(payload, ['updated_time', 'updatedAt']),
  }
}

function creativeFields(payload: JsonRecord) {
  return {
    account_id: text(payload, ['account_id']),
    campaign_id: text(payload, ['campaign_id', 'campaign.id']),
    ad_group_id: text(payload, ['adset_id', 'adGroup.id']),
    ad_id: text(payload, ['ad_id', 'adGroupAd.ad.id']),
    nome: text(payload, ['name', 'asset.name']),
    tipo: text(payload, ['object_type', 'asset.type']),
    titulo: text(payload, ['title']),
    texto: text(payload, ['body', 'asset.textAsset.text', 'asset.text_asset.text']),
    url: text(payload, ['asset.imageAsset.fullSize.url', 'asset.image_asset.full_size.url']),
    thumbnail_url: text(payload, ['thumbnail_url']),
    status: text(payload, ['status']),
  }
}

function keywordFields(payload: JsonRecord) {
  return {
    account_id: text(payload, ['account_id', 'customer.id']),
    campaign_id: text(payload, ['campaign.id', 'campaign_id']),
    ad_group_id: text(payload, ['adGroup.id', 'ad_group.id', 'ad_group_id']),
    keyword_id: text(payload, ['adGroupCriterion.criterionId', 'ad_group_criterion.criterion_id']),
    keyword_text: text(payload, ['adGroupCriterion.keyword.text', 'ad_group_criterion.keyword.text']),
    match_type: text(payload, ['adGroupCriterion.keyword.matchType', 'ad_group_criterion.keyword.match_type']),
    status: text(payload, ['adGroupCriterion.status', 'ad_group_criterion.status']),
    data_ref: dateValue(payload, ['segments.date', 'date', 'date_start']),
    spend: microsValue(payload, ['metrics.costMicros', 'metrics.cost_micros']) ?? numberValue(payload, ['spend']),
    impressions: numberValue(payload, ['metrics.impressions', 'impressions']),
    clicks: numberValue(payload, ['metrics.clicks', 'clicks']),
    conversions: numberValue(payload, ['metrics.conversions', 'conversions']),
  }
}

function conversionFields(payload: JsonRecord) {
  const purchaseNames = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']
  return {
    account_id: text(payload, ['account_id', 'customer.id']),
    campaign_id: text(payload, ['campaign_id', 'campaign.id']),
    conversion_id: text(payload, ['conversionAction.id', 'conversion_action.id', 'action_type']),
    nome: text(payload, ['conversionAction.name', 'conversion_action.name', 'action_type', 'campaign_name']),
    tipo: text(payload, ['conversionAction.type', 'conversion_action.type', 'action_type']),
    categoria: text(payload, ['conversionAction.category', 'conversion_action.category']),
    status: text(payload, ['conversionAction.status', 'conversion_action.status']),
    data_ref: dateValue(payload, ['segments.date', 'date_start', 'date']),
    conversions: numberValue(payload, ['metrics.conversions', 'conversions']) ?? actionMetric(payload, purchaseNames),
    conversion_value: numberValue(payload, ['metrics.conversionsValue', 'metrics.conversions_value']) ?? actionValue(payload, purchaseNames),
  }
}

function insightFields(input: NormalizationInput, payload: JsonRecord) {
  const spend = numberValue(payload, ['spend']) ?? microsValue(payload, ['metrics.costMicros', 'metrics.cost_micros'])
  const conversionValue = numberValue(payload, ['metrics.conversionsValue', 'metrics.conversions_value'])
    ?? actionValue(payload, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'])
  return {
    data_ref: dateValue(payload, ['segments.date', 'date_start', 'date']),
    nivel: input.resource === 'insights_ad_daily' ? 'ad' : 'campaign',
    account_id: text(payload, ['account_id', 'customer.id']),
    campaign_id: text(payload, ['campaign_id', 'campaign.id']),
    campaign_name: text(payload, ['campaign_name', 'campaign.name']),
    ad_group_id: text(payload, ['adset_id', 'adGroup.id', 'ad_group.id']),
    ad_group_name: text(payload, ['adset_name', 'adGroup.name', 'ad_group.name']),
    ad_id: text(payload, ['ad_id', 'adGroupAd.ad.id', 'ad_group_ad.ad.id']),
    ad_name: text(payload, ['ad_name', 'adGroupAd.ad.name', 'ad_group_ad.ad.name']),
    spend,
    currency: text(payload, ['currency', 'customer.currencyCode']),
    impressions: numberValue(payload, ['impressions', 'metrics.impressions']),
    reach: numberValue(payload, ['reach']),
    clicks: numberValue(payload, ['clicks', 'metrics.clicks']),
    conversions: numberValue(payload, ['conversions', 'metrics.conversions'])
      ?? actionMetric(payload, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']),
    conversion_value: conversionValue,
    ctr: numberValue(payload, ['ctr', 'metrics.ctr']),
    cpc: numberValue(payload, ['cpc', 'metrics.averageCpc', 'metrics.average_cpc']),
    cpm: numberValue(payload, ['cpm', 'metrics.averageCpm', 'metrics.average_cpm']),
    roas: roasValue(payload) ?? (spend && conversionValue ? conversionValue / spend : null),
  }
}

function fieldsFor(input: NormalizationInput, table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'paid_media_accounts') return accountFields(payload)
  if (table === 'paid_media_creatives') return creativeFields(payload)
  if (table === 'paid_media_keywords') return keywordFields(payload)
  if (table === 'paid_media_conversions') return conversionFields(payload)
  if (table === 'paid_media_insights_daily') return insightFields(input, payload)
  return entityFields(payload)
}

export function normalizePaidMediaRows(input: NormalizationInput): NormalizationResult {
  const table = RESOURCE_TABLES[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso paid media ${input.resource} nao possui tabela normalized v1.`,
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
