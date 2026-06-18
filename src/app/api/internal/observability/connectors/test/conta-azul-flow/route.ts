import type { BigQuery } from '@google-cloud/bigquery'
import { NextRequest } from 'next/server'

import {
  createBigQueryClient,
  getBigQueryProjectId,
} from '@/lib/bigqueryClient'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import { requestLocalSync } from '@/products/integracoes/server/integrationControlClient'
import {
  getIntegrationBigQueryDestinationForConnection,
  getIntegrationConnection,
  listIntegrationConnections,
  listIntegrationPipelines,
  listIntegrationSyncRuns,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationPipeline } from '@/products/integracoes/shared/contracts/pipelineContracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CONTA_AZUL_PROVIDER = 'conta_azul'
const NORMALIZED_TABLE_BY_RESOURCE: Record<string, string> = {
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  produtos: 'produtos',
  contas_receber: 'contas_receber',
  contas_pagar: 'contas_pagar',
  vendas: 'vendas',
  itens_venda: 'itens_venda',
  venda_detalhes: 'venda_detalhes',
  notas_fiscais: 'notas_fiscais',
  notas_fiscais_servico: 'notas_fiscais_servico',
  categorias: 'categorias',
  centros_custo: 'centros_custo',
  contas_financeiras: 'contas_financeiras',
  transferencias: 'transferencias',
}

type TableDiagnostic = {
  tableName: string
  rowCount: number
  lastModifiedAt: string | null
}

type DatasetDiagnostic = {
  dataset: string
  ok: boolean
  exists: boolean
  tableCount: number
  totalRows: number
  expectedTables: string[]
  missingTables: string[]
  tables: TableDiagnostic[]
  error?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
}

function toText(value: unknown) {
  return String(value ?? '').trim()
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
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'object' && 'value' in value && typeof value.value === 'string') return value.value
  return String(value)
}

function expectedRawTables(provider: string, resources: string[]) {
  return resources.map((resource) => `${provider}_${resource}`)
}

function expectedNormalizedTables(resources: string[]) {
  return Array.from(new Set(resources.map((resource) => NORMALIZED_TABLE_BY_RESOURCE[resource]).filter(Boolean)))
}

function resourceList(connection: IntegrationConnection | null, pipeline: IntegrationPipeline | null, requested?: string[]) {
  return requested?.length
    ? requested
    : pipeline?.selectedResources?.length
      ? pipeline.selectedResources
      : connection?.selectedResources || []
}

async function inspectDataset(input: {
  client: BigQuery
  projectId: string
  dataset: string
  expectedTables: string[]
}): Promise<DatasetDiagnostic> {
  try {
    const dataset = normalizeBigQueryIdentifier(input.dataset)
    const [rows] = await input.client.query({
      query: `
        SELECT
          table_id AS tableName,
          row_count AS rowCount,
          TIMESTAMP_MILLIS(last_modified_time) AS lastModifiedAt
        FROM \`${input.projectId}.${dataset}.__TABLES__\`
        ORDER BY table_id ASC
        LIMIT 250`,
      location: process.env.BIGQUERY_LOCATION || process.env.GCP_BIGQUERY_LOCATION || 'US',
    })

    const tables = rows.map((row: unknown) => {
      const record = asRecord(row)
      return {
        tableName: toText(record.tableName),
        rowCount: Number(record.rowCount || 0),
        lastModifiedAt: toIsoString(record.lastModifiedAt),
      }
    })
    const tableNames = new Set(tables.map((table) => table.tableName))
    const missingTables = input.expectedTables.filter((table) => !tableNames.has(table))

    return {
      dataset,
      ok: missingTables.length === 0,
      exists: true,
      tableCount: tables.length,
      totalRows: tables.reduce((sum, table) => sum + table.rowCount, 0),
      expectedTables: input.expectedTables,
      missingTables,
      tables,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao consultar dataset BigQuery'
    const notFound = message.toLowerCase().includes('not found')
    return {
      dataset: input.dataset,
      ok: false,
      exists: !notFound,
      tableCount: 0,
      totalRows: 0,
      expectedTables: input.expectedTables,
      missingTables: input.expectedTables,
      tables: [],
      error: message,
    }
  }
}

async function resolveContaAzulConnection(tenantId: number, connectionId?: string) {
  if (connectionId) {
    const connection = await getIntegrationConnection(connectionId, tenantId)
    return connection?.provider === CONTA_AZUL_PROVIDER ? connection : null
  }

  const connections = await listIntegrationConnections({
    tenantId,
    domain: 'erp',
    provider: CONTA_AZUL_PROVIDER,
    limit: 20,
  })
  return connections.find((connection) => connection.status === 'connected')
    || connections[0]
    || null
}

async function resolveFlow(input: {
  tenantId: number
  connectionId?: string
  runId?: string
  resources?: string[]
}) {
  const connection = await resolveContaAzulConnection(input.tenantId, input.connectionId)
  const pipelines = connection
    ? await listIntegrationPipelines({
      tenantId: input.tenantId,
      sourceConnectionId: connection.id,
      limit: 20,
    })
    : []
  const pipeline = pipelines.find((item) => item.status === 'active' && item.syncEnabled)
    || pipelines.find((item) => item.status === 'active')
    || pipelines[0]
    || null
  const destination = connection
    ? await getIntegrationBigQueryDestinationForConnection(connection.id, input.tenantId)
    : null
  const runs = connection
    ? await listIntegrationSyncRuns({
      tenantId: input.tenantId,
      connectionId: connection.id,
      limit: 10,
    })
    : []
  const selectedRun = input.runId
    ? runs.find((run) => run.id === input.runId) || null
    : runs[0] || null
  const resources = resourceList(connection, pipeline, input.resources)
  const config = getIntegrationsCloudConfig()
  const projectId = getBigQueryProjectId(config.projectId) || config.projectId
  const datasets = getTenantBigQueryDatasets(input.tenantId)
  const client = createBigQueryClient({ projectId })
  const [raw, normalized] = await Promise.all([
    inspectDataset({
      client,
      projectId,
      dataset: datasets.rawDataset,
      expectedTables: expectedRawTables(CONTA_AZUL_PROVIDER, resources),
    }),
    inspectDataset({
      client,
      projectId,
      dataset: datasets.normalizedDataset,
      expectedTables: expectedNormalizedTables(resources),
    }),
  ])
  const issues = [
    !connection ? 'Conexao Conta Azul ausente' : null,
    connection && connection.status !== 'connected' ? `Conexao Conta Azul com status ${connection.status}` : null,
    !pipeline ? 'Pipeline Conta Azul -> BigQuery ausente' : null,
    pipeline && pipeline.status !== 'active' ? `Pipeline com status ${pipeline.status}` : null,
    pipeline && !pipeline.syncEnabled ? 'Pipeline com sync desativado' : null,
    !destination ? 'Destination BigQuery ativo ausente' : null,
    destination && destination.status !== 'active' ? `Destination BigQuery com status ${destination.status}` : null,
    !resources.length ? 'Nenhum recurso selecionado para sincronizacao' : null,
    !raw.ok ? `Raw incompleto: ${raw.error || `${raw.missingTables.length} tabela(s) ausente(s)`}` : null,
    !normalized.ok ? `Normalized incompleto: ${normalized.error || `${normalized.missingTables.length} tabela(s) ausente(s)`}` : null,
  ].filter(Boolean) as string[]

  return {
    tenantId: input.tenantId,
    provider: CONTA_AZUL_PROVIDER,
    projectId,
    ok: issues.length === 0,
    canRunE2E: Boolean(connection && connection.status === 'connected' && pipeline?.status === 'active' && pipeline.syncEnabled && destination?.status === 'active' && resources.length),
    issues,
    connection,
    destination,
    pipeline,
    resources,
    expected: {
      rawTables: expectedRawTables(CONTA_AZUL_PROVIDER, resources),
      normalizedTables: expectedNormalizedTables(resources),
    },
    datasets: {
      raw,
      normalized,
    },
    selectedRun,
    runs,
  }
}

function syncResourceOverride(value: unknown) {
  const resources = asStringArray(value)
  return resources?.length ? resources : undefined
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })
    const flow = await resolveFlow({
      tenantId: tenant.tenantId,
      connectionId: req.nextUrl.searchParams.get('connectionId') || req.nextUrl.searchParams.get('connection_id') || undefined,
      runId: req.nextUrl.searchParams.get('runId') || req.nextUrl.searchParams.get('run_id') || undefined,
    })

    return Response.json({
      ok: true,
      flow,
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao diagnosticar fluxo Conta Azul' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = asRecord(await req.json().catch(() => ({})))
    const tenant = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'),
      access: 'manage',
    })
    const flow = await resolveFlow({
      tenantId: tenant.tenantId,
      connectionId: toText(payload.connectionId || payload.connection_id) || undefined,
      resources: syncResourceOverride(payload.resources),
    })

    if (!flow.connection) {
      return Response.json({ ok: false, error: 'Conexao Conta Azul nao encontrada.' }, { status: 404 })
    }
    if (!flow.canRunE2E) {
      return Response.json({
        ok: false,
        error: flow.issues[0] || 'Fluxo Conta Azul nao esta pronto para E2E.',
        flow,
      }, { status: 409 })
    }

    const resources = syncResourceOverride(payload.resources) || flow.resources
    const result = await requestLocalSync({
      tenantId: tenant.tenantId,
      connectionId: flow.connection.id,
      pipelineId: flow.pipeline?.id,
      destinationId: flow.destination?.id,
      trigger: 'manual',
      resources,
      requestedBy: 'observability-connectors-e2e',
    })

    if (!result) {
      return Response.json({ ok: false, error: 'Nao foi possivel criar sync_run para E2E.' }, { status: 500 })
    }

    return Response.json({
      ok: true,
      result,
      flow: {
        ...flow,
        resources,
      },
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao disparar E2E Conta Azul' },
      { status: 500 },
    )
  }
}
