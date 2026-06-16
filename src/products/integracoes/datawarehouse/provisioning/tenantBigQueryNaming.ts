export type TenantBigQueryDatasets = {
  rawDataset: string
  normalizedDataset: string
}

export type TenantBigQueryDestinationConfig = TenantBigQueryDatasets & {
  projectId?: string
  dataset?: string
  datasetMode: 'per_tenant' | 'shared'
}

type JsonRecord = Record<string, unknown>

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeBigQueryDatasetId(value: string, label = 'dataset') {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (!/^[a-z_][a-z0-9_]{0,1023}$/.test(normalized)) {
    throw new Error(`${label} BigQuery invalido: ${value}`)
  }
  return normalized
}

export function getTenantBigQueryDatasets(tenantId: number): TenantBigQueryDatasets {
  const normalizedTenantId = Number(tenantId)
  if (!Number.isInteger(normalizedTenantId) || normalizedTenantId <= 0) {
    throw new Error(`tenantId invalido para dataset BigQuery: ${tenantId}`)
  }

  return {
    rawDataset: normalizeBigQueryDatasetId(`org_${normalizedTenantId}_raw`, 'rawDataset'),
    normalizedDataset: normalizeBigQueryDatasetId(`org_${normalizedTenantId}_normalized`, 'normalizedDataset'),
  }
}

export function buildTenantBigQueryDestinationConfig(
  tenantId: number,
  input?: JsonRecord,
  fallbackProjectId?: string,
): TenantBigQueryDestinationConfig {
  const config = input || {}
  const requestedMode = toText(config.datasetMode ?? config.dataset_mode)
  const datasetMode = requestedMode === 'shared' ? 'shared' : 'per_tenant'
  const tenantDatasets = getTenantBigQueryDatasets(tenantId)
  const rawDataset = datasetMode === 'shared'
    ? normalizeBigQueryDatasetId(
      toText(config.rawDataset ?? config.raw_dataset ?? config.dataset) || tenantDatasets.rawDataset,
      'rawDataset',
    )
    : tenantDatasets.rawDataset
  const normalizedDataset = datasetMode === 'shared'
    ? normalizeBigQueryDatasetId(
      toText(config.normalizedDataset ?? config.normalized_dataset) || tenantDatasets.normalizedDataset,
      'normalizedDataset',
    )
    : tenantDatasets.normalizedDataset
  const projectId = toText(config.projectId ?? config.project_id) || toText(fallbackProjectId) || undefined

  return {
    ...config,
    ...(projectId ? { projectId } : {}),
    datasetMode,
    dataset: rawDataset,
    rawDataset,
    normalizedDataset,
  }
}
