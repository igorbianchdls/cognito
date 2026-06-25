import { authorizedJsonRequest } from '@/products/integracoes/cloud/src/lib/googleAuth'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import {
  getTenantBigQueryDatasets,
  normalizeBigQueryDatasetId,
} from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryNaming'
import {
  ensureDefaultTenantBigQueryDestination,
  markTenantBigQueryProvisioningFailed,
  markTenantBigQueryProvisioningSucceeded,
} from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryRepository'

export type TenantBigQueryProvisioningInput = {
  tenantId: number
  reason?: string
}

export type TenantBigQueryProvisioningResult = {
  ok: boolean
  tenantId: number
  projectId: string
  destinationId: string | null
  rawDataset: string
  normalizedDataset: string
  analyticsDataset: string
  error?: string
}

async function ensureBigQueryDataset(input: {
  projectId: string
  dataset: string
  tenantId: number
  reason?: string
}) {
  const dataset = normalizeBigQueryDatasetId(input.dataset)
  const existing = await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${input.projectId}/datasets/${dataset}`,
    { method: 'GET', allowNotFound: true },
  )
  if (existing.ok) return

  await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${input.projectId}/datasets`,
    {
      method: 'POST',
      body: JSON.stringify({
        datasetReference: {
          projectId: input.projectId,
          datasetId: dataset,
        },
        location: process.env.BIGQUERY_LOCATION || process.env.GCP_BIGQUERY_LOCATION || 'US',
        labels: {
          managed_by: 'integracoes',
          dataset_mode: 'per_tenant',
          tenant_id: String(input.tenantId),
        },
      }),
    },
  )
}

export async function provisionTenantBigQuery(
  input: TenantBigQueryProvisioningInput,
): Promise<TenantBigQueryProvisioningResult> {
  const tenantId = Number(input.tenantId)
  const config = getIntegrationsCloudConfig()
  const datasets = getTenantBigQueryDatasets(tenantId)
  let destinationId: string | null = null

  try {
    const destination = await ensureDefaultTenantBigQueryDestination({
      tenantId,
      reason: input.reason || 'provision',
    })
    destinationId = destination.id

    await Promise.all([
      ensureBigQueryDataset({
        projectId: config.projectId,
        dataset: datasets.rawDataset,
        tenantId,
        reason: input.reason,
      }),
      ensureBigQueryDataset({
        projectId: config.projectId,
        dataset: datasets.analyticsDataset,
        tenantId,
        reason: input.reason,
      }),
      ensureBigQueryDataset({
        projectId: config.projectId,
        dataset: datasets.normalizedDataset,
        tenantId,
        reason: input.reason,
      }),
    ])

    await markTenantBigQueryProvisioningSucceeded({
      tenantId,
      destinationId,
      projectId: config.projectId,
      rawDataset: datasets.rawDataset,
      normalizedDataset: datasets.normalizedDataset,
      analyticsDataset: datasets.analyticsDataset,
      reason: input.reason,
    })

    return {
      ok: true,
      tenantId,
      projectId: config.projectId,
      destinationId,
      rawDataset: datasets.rawDataset,
      normalizedDataset: datasets.normalizedDataset,
      analyticsDataset: datasets.analyticsDataset,
    }
  } catch (error) {
    await markTenantBigQueryProvisioningFailed({
      tenantId,
      destinationId,
      projectId: config.projectId,
      error,
      reason: input.reason,
    }).catch(() => undefined)

    return {
      ok: false,
      tenantId,
      projectId: config.projectId,
      destinationId,
      rawDataset: datasets.rawDataset,
      normalizedDataset: datasets.normalizedDataset,
      analyticsDataset: datasets.analyticsDataset,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
