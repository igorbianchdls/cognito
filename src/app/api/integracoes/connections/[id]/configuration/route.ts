import { NextRequest } from 'next/server'

import { createBigQueryClient, getBigQueryProjectId } from '@/lib/bigqueryClient'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryNaming'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import {
  ensureDefaultTenantBigQueryDestination,
  markTenantBigQueryProvisioningSucceeded,
} from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryRepository'
import { provisionTenantBigQuery } from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryProvisioning'
import {
  createIntegrationEvent,
  createIntegrationPipeline,
  getIntegrationConnection,
  getIntegrationPluginPermissions,
  listIntegrationDestinations,
  listIntegrationPipelines,
  updateIntegrationPipeline,
  upsertIntegrationPluginPermissions,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  assertCanManageIntegrationConnection,
  IntegrationApiAuthError,
} from '@/products/integracoes/server/integrationApiAuth'
import { normalizeRequestedResources, requireIntegrationProvider } from '@/products/integracoes/server/integrationProviderRegistry'
import { serializeConnectionWithUi } from '@/products/integracoes/server/integrationStatusMapper'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import type { IntegrationDestination } from '@/products/integracoes/destinations/shared/destinationContracts'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationPipeline } from '@/products/integracoes/shared/contracts/pipelineContracts'
import type { IntegrationPluginPermissions } from '@/products/integracoes/shared/contracts/pluginPermissionContracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPPORTED_SYNC_FREQUENCIES = new Set(['manual', 'hourly', 'every_6_hours', 'every_12_hours', 'daily'])

type JsonRecord = Record<string, unknown>
type McpPreset = 'blocked' | 'read_only' | 'actions_with_confirmation'

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
}

function normalizeSyncFrequency(value: unknown, fallback = 'manual') {
  const frequency = String(value || fallback).trim()
  if (!SUPPORTED_SYNC_FREQUENCIES.has(frequency)) {
    throw new Error(`Frequencia de sync invalida: ${frequency}`)
  }
  return frequency
}

function getProjectId(destination: IntegrationDestination | null) {
  const value = destination?.config?.projectId ?? destination?.config?.project_id
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function defaultPermissions(connectionId: string, tenantId: number): IntegrationPluginPermissions {
  return {
    id: '',
    tenantId,
    connectionId,
    enabled: false,
    readResources: [],
    liveReadResources: [],
    writeResources: [],
    destructiveResources: [],
    requireConfirmation: true,
    metadata: {},
    createdAt: '',
    updatedAt: '',
  }
}

function normalizeMcpPreset(value: unknown): McpPreset {
  if (value === 'read_only' || value === 'actions_with_confirmation' || value === 'blocked') return value
  return 'blocked'
}

function applyMcpPreset(preset: McpPreset, resources: string[]) {
  if (preset === 'read_only') {
    return {
      enabled: true,
      readResources: resources,
      liveReadResources: [],
      writeResources: [],
      destructiveResources: [],
      requireConfirmation: true,
    }
  }

  if (preset === 'actions_with_confirmation') {
    return {
      enabled: true,
      readResources: resources,
      liveReadResources: ['*'],
      writeResources: ['*'],
      destructiveResources: [],
      requireConfirmation: true,
    }
  }

  return {
    enabled: false,
    readResources: [],
    liveReadResources: [],
    writeResources: [],
    destructiveResources: [],
    requireConfirmation: true,
  }
}

function providerResourceSlugs(provider: ReturnType<typeof requireIntegrationProvider>) {
  return provider.resources.map((resource) => resource.slug)
}

function normalizePermissionResources(
  provider: ReturnType<typeof requireIntegrationProvider>,
  value: unknown,
  fallback: string[],
  wildcardResources = providerResourceSlugs(provider),
) {
  const requested = asStringArray(value)
  const source = requested === undefined ? fallback : requested
  if (source.includes('*')) return normalizeRequestedResources(provider, wildcardResources)
  return normalizeRequestedResources(provider, source)
}

function nextSyncAtFor(frequency: string) {
  return frequency === 'manual' ? null : new Date().toISOString()
}

async function markBigQueryProvisioningSucceededIfDatasetsExist(input: {
  tenantId: number
  destination: IntegrationDestination
  reason: string
}) {
  const config = getIntegrationsCloudConfig()
  const projectId = getBigQueryProjectId(getProjectId(input.destination) || config.projectId) || config.projectId
  const datasets = getTenantBigQueryDatasets(input.tenantId)
  const client = createBigQueryClient({ projectId })
  const [rawExists] = await client.dataset(datasets.rawDataset).exists()
  const [normalizedExists] = await client.dataset(datasets.normalizedDataset).exists()
  const [analyticsExists] = await client.dataset(datasets.analyticsDataset).exists()
  if (!rawExists || !normalizedExists || !analyticsExists) return

  await markTenantBigQueryProvisioningSucceeded({
    tenantId: input.tenantId,
    destinationId: input.destination.id,
    projectId,
    rawDataset: datasets.rawDataset,
    normalizedDataset: datasets.normalizedDataset,
    analyticsDataset: datasets.analyticsDataset,
    reason: input.reason,
  })
}

async function findConfigurationParts(input: {
  connection: IntegrationConnection
  tenantId: number
  ensureDestination?: boolean
}): Promise<{
  destination: IntegrationDestination | null
  pipeline: IntegrationPipeline | null
  permissions: IntegrationPluginPermissions
}> {
  const destination = input.ensureDestination
    ? await ensureDefaultTenantBigQueryDestination({
      tenantId: input.tenantId,
      reason: 'connection_configuration',
    })
    : (
      await listIntegrationDestinations({
        tenantId: input.tenantId,
        type: 'bigquery',
        status: 'active',
        limit: 50,
      })
    ).find((item) => item.metadata?.isDefault === true || item.metadata?.isDefault === 'true') || null

  const pipelines = await listIntegrationPipelines({
    tenantId: input.tenantId,
    sourceConnectionId: input.connection.id,
    limit: 100,
  })
  const pipeline = destination
    ? pipelines.find((item) => item.destinationId === destination.id && item.status !== 'disabled') || null
    : null
  const permissions = await getIntegrationPluginPermissions(input.connection.id, input.tenantId)

  return {
    destination,
    pipeline,
    permissions: permissions || defaultPermissions(input.connection.id, input.tenantId),
  }
}

function buildConfiguration(input: {
  connection: IntegrationConnection
  destination: IntegrationDestination | null
  pipeline: IntegrationPipeline | null
  permissions: IntegrationPluginPermissions
}) {
  const provider = requireIntegrationProvider(input.connection.provider)

  return {
    connection: serializeConnectionWithUi(input.connection),
    provider,
    destination: input.destination,
    pipeline: input.pipeline,
    permissions: input.permissions,
    datasets: {
      projectId: getProjectId(input.destination),
      ...getTenantBigQueryDatasets(input.connection.tenantId),
    },
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { tenantId, authMode } = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })
    if (authMode === 'api_token') assertCanManageIntegrationConnection(req, connection)

    const parts = await findConfigurationParts({ connection, tenantId })
    return Response.json({ ok: true, configuration: buildConfiguration({ connection, ...parts }) })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof IntegrationApiAuthError) {
      return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
    }
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar configuracao da conexao' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as JsonRecord
    const { tenantId, authMode } = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'),
      access: 'manage',
    })
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })
    if (authMode === 'api_token') assertCanManageIntegrationConnection(req, connection)

    const provider = requireIntegrationProvider(connection.provider)
    const dataWarehouse = asRecord(payload.dataWarehouse ?? payload.data_warehouse)
    const mcp = asRecord(payload.mcp)
    const configuredAt = new Date().toISOString()

    let parts = await findConfigurationParts({
      connection,
      tenantId,
      ensureDestination: Boolean(dataWarehouse.enabled),
    })

    if ('enabled' in dataWarehouse) {
      const dataWarehouseEnabled = Boolean(dataWarehouse.enabled)
      const selectedResources = normalizeRequestedResources(
        provider,
        asStringArray(dataWarehouse.selectedResources ?? dataWarehouse.selected_resources) || connection.selectedResources,
      )
      const syncFrequency = normalizeSyncFrequency(dataWarehouse.syncFrequency ?? dataWarehouse.sync_frequency, connection.syncFrequency)

      if (dataWarehouseEnabled) {
        const provision = await provisionTenantBigQuery({
          tenantId,
          reason: 'connection_configuration',
        })
        if (!provision.ok) {
          throw new Error(provision.error || 'Falha ao provisionar datasets BigQuery')
        }
        if (!parts.destination) {
          parts.destination = await ensureDefaultTenantBigQueryDestination({
            tenantId,
            reason: 'connection_configuration',
          })
        }
        const destination = parts.destination
        await markBigQueryProvisioningSucceededIfDatasetsExist({
          tenantId,
          destination,
          reason: 'connection_configuration',
        }).catch(() => undefined)

        if (!parts.pipeline) {
          parts.pipeline = await createIntegrationPipeline({
            tenantId,
            sourceConnectionId: connection.id,
            destinationId: destination.id,
            name: `${connection.displayName} -> ${destination.name}`,
            status: 'active',
            selectedResources,
            syncFrequency,
            syncEnabled: true,
            nextSyncAt: nextSyncAtFor(syncFrequency),
            metadata: {
              configuredFrom: 'connection_configuration_modal',
              configuredAt,
              dataWarehouseEnabled: true,
            },
          })
        } else {
          parts.pipeline = await updateIntegrationPipeline(parts.pipeline.id, tenantId, {
            status: 'active',
            selectedResources,
            syncFrequency,
            syncEnabled: true,
            nextSyncAt: nextSyncAtFor(syncFrequency),
            metadata: {
              configuredFrom: 'connection_configuration_modal',
              configuredAt,
              dataWarehouseEnabled: true,
            },
          })
        }
        parts.permissions = await upsertIntegrationPluginPermissions({
          tenantId,
          connectionId: connection.id,
          readResources: selectedResources,
          metadata: {
            readResourcesSyncedFromDataWarehouseAt: configuredAt,
            configuredFrom: 'connection_configuration_modal',
          },
        })
      } else if (parts.pipeline) {
        parts.pipeline = await updateIntegrationPipeline(parts.pipeline.id, tenantId, {
          status: 'paused',
          syncEnabled: false,
          nextSyncAt: null,
          metadata: {
            configuredFrom: 'connection_configuration_modal',
            configuredAt,
            dataWarehouseEnabled: false,
          },
        })
      }
    }

    if (Object.keys(mcp).length > 0) {
      const currentPermissions = parts.permissions
      const preset = normalizeMcpPreset(mcp.preset ?? currentPermissions.metadata?.mcpPreset)
      const baseResources = parts.pipeline?.selectedResources?.length
        ? parts.pipeline.selectedResources
        : connection.selectedResources
      const presetPermissions = applyMcpPreset(preset, baseResources)

      parts.permissions = await upsertIntegrationPluginPermissions({
        tenantId,
        connectionId: connection.id,
        enabled: mcp.enabled == null ? presetPermissions.enabled : Boolean(mcp.enabled),
        readResources: normalizePermissionResources(
          provider,
          mcp.readResources ?? mcp.read_resources,
          presetPermissions.readResources,
          baseResources,
        ),
        liveReadResources: normalizePermissionResources(
          provider,
          mcp.liveReadResources ?? mcp.live_read_resources,
          presetPermissions.liveReadResources,
        ),
        writeResources: normalizePermissionResources(provider, mcp.writeResources ?? mcp.write_resources, presetPermissions.writeResources),
        destructiveResources: normalizePermissionResources(
          provider,
          mcp.destructiveResources ?? mcp.destructive_resources,
          presetPermissions.destructiveResources,
        ),
        requireConfirmation: mcp.requireConfirmation == null && mcp.require_confirmation == null
          ? presetPermissions.requireConfirmation
          : Boolean(mcp.requireConfirmation ?? mcp.require_confirmation),
        metadata: {
          mcpPreset: preset,
          configuredFrom: 'connection_configuration_modal',
          configuredAt,
        },
      })
    }

    await createIntegrationEvent({
      tenantId,
      connectionId: connection.id,
      eventType: 'connection.updated',
      severity: 'info',
      actor: 'integracoes-api',
      message: 'Configuracao da conexao atualizada',
      metadata: {
        configuredFrom: 'connection_configuration_modal',
        dataWarehouseUpdated: 'enabled' in dataWarehouse,
        mcpUpdated: Object.keys(mcp).length > 0,
      },
    }).catch(() => null)

    parts = await findConfigurationParts({ connection, tenantId })
    return Response.json({ ok: true, configuration: buildConfiguration({ connection, ...parts }) })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof IntegrationApiAuthError) {
      return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
    }
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao salvar configuracao da conexao' },
      { status: 500 },
    )
  }
}
