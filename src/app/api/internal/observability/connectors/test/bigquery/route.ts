import type { BigQuery } from '@google-cloud/bigquery'
import { NextRequest } from 'next/server'

import {
  createBigQueryClient,
  getBigQueryProjectId,
} from '@/lib/bigqueryClient'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type DatasetDiagnostic = {
  dataset: string
  ok: boolean
  tables: Array<{
    tableName: string
    rowCount: number
    lastModifiedAt: string | null
  }>
  error?: string
}

function normalizeBigQueryIdentifier(value: string) {
  const normalized = value.trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/.test(normalized)) {
    throw new Error(`Identificador BigQuery invalido: ${value}`)
  }
  return normalized
}

function toIsoString(value: unknown) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'value' in value && typeof value.value === 'string') return value.value
  return String(value)
}

async function inspectDataset(client: BigQuery, projectId: string, dataset: string): Promise<DatasetDiagnostic> {
  try {
    const datasetId = normalizeBigQueryIdentifier(dataset)
    const [rows] = await client.query({
      query: `
        SELECT
          table_id AS tableName,
          row_count AS rowCount,
          TIMESTAMP_MILLIS(last_modified_time) AS lastModifiedAt
        FROM \`${projectId}.${datasetId}.__TABLES__\`
        ORDER BY last_modified_time DESC
        LIMIT 25`,
      location: process.env.BIGQUERY_LOCATION || process.env.GCP_BIGQUERY_LOCATION || 'US',
    })

    return {
      dataset: datasetId,
      ok: true,
      tables: rows.map((row: unknown) => {
        const record = row as Record<string, unknown>
        return {
          tableName: String(record.tableName || ''),
          rowCount: Number(record.rowCount || 0),
          lastModifiedAt: toIsoString(record.lastModifiedAt),
        }
      }),
    }
  } catch (error) {
    return {
      dataset,
      ok: false,
      tables: [],
      error: error instanceof Error ? error.message : 'Falha ao consultar dataset BigQuery',
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })
    const config = getIntegrationsCloudConfig()
    const projectId = getBigQueryProjectId(config.projectId) || config.projectId
    const client = createBigQueryClient({ projectId })
    const tenantDatasets = getTenantBigQueryDatasets(tenant.tenantId)
    const datasets = [
      tenantDatasets.rawDataset,
      tenantDatasets.normalizedDataset,
    ]

    const diagnostics = await Promise.all(
      datasets.map((dataset) => inspectDataset(client, projectId, dataset)),
    )

    return Response.json({
      ok: true,
      allOk: diagnostics.every((dataset) => dataset.ok),
      tenantId: tenant.tenantId,
      projectId,
      datasets: diagnostics,
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao testar BigQuery' },
      { status: 500 },
    )
  }
}
