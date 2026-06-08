import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import type {
  CreateIntegrationConnectionInput,
  IntegrationConnection,
  UpdateIntegrationConnectionInput,
} from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  CreateIntegrationDestinationInput,
  IntegrationDestination,
  IntegrationDestinationStatus,
  IntegrationDestinationType,
  UpdateIntegrationDestinationInput,
} from '@/products/integracoes/shared/contracts/destinationContracts'
import type {
  CreateIntegrationEventInput,
  IntegrationEvent,
  IntegrationEventSeverity,
  IntegrationEventType,
} from '@/products/integracoes/shared/contracts/eventContracts'
import type {
  IntegrationSyncRun,
  IntegrationSyncRunStatus,
  IntegrationSyncTrigger,
} from '@/products/integracoes/shared/contracts/syncContracts'
import type {
  CreateIntegrationPipelineInput,
  IntegrationPipeline,
  IntegrationPipelineStatus,
  UpdateIntegrationPipelineInput,
} from '@/products/integracoes/shared/contracts/pipelineContracts'
import type {
  IntegrationMcpPermissions,
  UpsertIntegrationMcpPermissionsInput,
} from '@/products/integracoes/shared/contracts/mcpPermissionContracts'
import type { IntegrationSyncMode } from '@/products/integracoes/shared/providers/providerTypes'
import {
  normalizeRequestedResources,
  requireIntegrationProvider,
} from '@/products/integracoes/server/integrationProviderRegistry'
import {
  normalizeConnectionStatus,
  normalizeSyncRunStatus,
} from '@/products/integracoes/server/integrationStatusMapper'

type JsonObject = Record<string, unknown>

type DbConnectionRow = {
  id: string | number
  tenant_id: number
  domain: string
  provider: string
  display_name: string
  status: string
  auth_type: string | null
  external_account_id: string | null
  secret_ref: string | null
  selected_resources: unknown
  sync_frequency: string
  sync_enabled?: boolean | null
  next_sync_at?: string | Date | null
  sync_locked_until?: string | Date | null
  sync_lock_token?: string | null
  sync_lock_owner?: string | null
  sync_modes: unknown
  last_sync_at: string | Date | null
  last_success_at: string | Date | null
  last_error: string | null
  records_synced: number
  metadata: unknown
  created_at: string | Date
  updated_at: string | Date
}

type DbSyncRunRow = {
  id: string | number
  tenant_id: number
  connection_id: string | number
  pipeline_id?: string | number | null
  destination_id?: string | number | null
  trigger: string
  status: string
  resource: string | null
  started_at: string | Date | null
  finished_at: string | Date | null
  records_in: number
  records_updated: number
  records_failed: number
  error_message: string | null
  metadata: unknown
  created_at: string | Date
}

type DbDestinationRow = {
  id: string | number
  tenant_id: number
  type: string
  name: string
  status: string
  config: unknown
  secret_ref: string | null
  metadata: unknown
  created_at: string | Date
  updated_at: string | Date
}

type DbPipelineRow = {
  id: string | number
  tenant_id: number
  source_connection_id: string | number
  destination_id: string | number
  name: string
  status: string
  selected_resources: unknown
  sync_frequency: string
  sync_enabled: boolean
  next_sync_at: string | Date | null
  sync_locked_until: string | Date | null
  sync_lock_token: string | null
  sync_lock_owner: string | null
  last_sync_at: string | Date | null
  last_success_at: string | Date | null
  last_error: string | null
  records_synced: number
  metadata: unknown
  created_at: string | Date
  updated_at: string | Date
}

type DbMcpPermissionsRow = {
  id: string | number
  tenant_id: number
  connection_id: string | number
  enabled: boolean
  read_resources: unknown
  write_resources: unknown
  destructive_resources: unknown
  require_confirmation: boolean
  metadata: unknown
  created_at: string | Date
  updated_at: string | Date
}

type DbEventRow = {
  id: string | number
  tenant_id: number
  connection_id: string | number | null
  event_type: string
  severity: string
  actor: string | null
  message: string
  metadata: unknown
  created_at: string | Date
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return asStringArray(parsed)
    } catch {
      return []
    }
  }
  return []
}

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonObject
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonObject : {}
    } catch {
      return {}
    }
  }
  return {}
}

function toConnection(row: DbConnectionRow): IntegrationConnection {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    domain: row.domain as IntegrationConnection['domain'],
    provider: row.provider,
    status: normalizeConnectionStatus(row.status),
    displayName: row.display_name,
    externalAccountId: row.external_account_id,
    secretRef: row.secret_ref,
    selectedResources: asStringArray(row.selected_resources),
    syncFrequency: row.sync_frequency,
    syncEnabled: row.sync_enabled == null ? true : Boolean(row.sync_enabled),
    nextSyncAt: toIsoString(row.next_sync_at),
    syncLockedUntil: toIsoString(row.sync_locked_until),
    syncLockToken: row.sync_lock_token || null,
    syncLockOwner: row.sync_lock_owner || null,
    syncModes: asStringArray(row.sync_modes) as IntegrationSyncMode[],
    lastSyncAt: toIsoString(row.last_sync_at),
    lastSuccessAt: toIsoString(row.last_success_at),
    lastError: row.last_error,
    recordsSynced: Number(row.records_synced || 0),
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function toSyncRun(row: DbSyncRunRow): IntegrationSyncRun {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    connectionId: String(row.connection_id),
    pipelineId: row.pipeline_id == null ? null : String(row.pipeline_id),
    destinationId: row.destination_id == null ? null : String(row.destination_id),
    trigger: row.trigger as IntegrationSyncTrigger,
    status: normalizeSyncRunStatus(row.status),
    startedAt: toIsoString(row.started_at),
    finishedAt: toIsoString(row.finished_at),
    resource: row.resource,
    recordsIn: Number(row.records_in || 0),
    recordsUpdated: Number(row.records_updated || 0),
    recordsFailed: Number(row.records_failed || 0),
    errorMessage: row.error_message,
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
  }
}

function normalizeDestinationType(value: unknown): IntegrationDestinationType {
  const type = String(value || '').trim()
  if (
    type === 'bigquery' ||
    type === 'google_sheets' ||
    type === 'excel' ||
    type === 'postgres' ||
    type === 'supabase' ||
    type === 'snowflake' ||
    type === 's3'
  ) return type
  return 'bigquery'
}

function normalizeDestinationStatus(value: unknown): IntegrationDestinationStatus {
  const status = String(value || '').trim()
  if (status === 'disabled' || status === 'error') return status
  return 'active'
}

function normalizePipelineStatus(value: unknown): IntegrationPipelineStatus {
  const status = String(value || '').trim()
  if (status === 'draft' || status === 'paused' || status === 'error' || status === 'disabled') return status
  return 'active'
}

function toDestination(row: DbDestinationRow): IntegrationDestination {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    type: normalizeDestinationType(row.type),
    name: row.name,
    status: normalizeDestinationStatus(row.status),
    config: asJsonObject(row.config),
    secretRef: row.secret_ref,
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function toPipeline(row: DbPipelineRow): IntegrationPipeline {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    sourceConnectionId: String(row.source_connection_id),
    destinationId: String(row.destination_id),
    name: row.name,
    status: normalizePipelineStatus(row.status),
    selectedResources: asStringArray(row.selected_resources),
    syncFrequency: row.sync_frequency,
    syncEnabled: Boolean(row.sync_enabled),
    nextSyncAt: toIsoString(row.next_sync_at),
    syncLockedUntil: toIsoString(row.sync_locked_until),
    syncLockToken: row.sync_lock_token,
    syncLockOwner: row.sync_lock_owner,
    lastSyncAt: toIsoString(row.last_sync_at),
    lastSuccessAt: toIsoString(row.last_success_at),
    lastError: row.last_error,
    recordsSynced: Number(row.records_synced || 0),
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function toMcpPermissions(row: DbMcpPermissionsRow): IntegrationMcpPermissions {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    connectionId: String(row.connection_id),
    enabled: Boolean(row.enabled),
    readResources: asStringArray(row.read_resources),
    writeResources: asStringArray(row.write_resources),
    destructiveResources: asStringArray(row.destructive_resources),
    requireConfirmation: Boolean(row.require_confirmation),
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function normalizeEventSeverity(severity: unknown): IntegrationEventSeverity {
  const value = String(severity || '').trim().toLowerCase()
  if (value === 'warning' || value === 'error') return value
  return 'info'
}

function normalizeEventType(eventType: unknown): IntegrationEventType {
  const value = String(eventType || '').trim().toLowerCase()
  if (
    value === 'connection.created' ||
    value === 'connection.updated' ||
    value === 'connection.oauth.connected' ||
    value === 'connection.reconnect_requested' ||
    value === 'sync.requested' ||
    value === 'sync.resource.started' ||
    value === 'sync.resource.completed' ||
    value === 'sync.resource.failed' ||
    value === 'sync.completed' ||
    value === 'sync.failed' ||
    value === 'auth.callback_received' ||
    value === 'system.note'
  ) {
    return value
  }

  return 'system.note'
}

function toEvent(row: DbEventRow): IntegrationEvent {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    connectionId: row.connection_id == null ? null : String(row.connection_id),
    eventType: normalizeEventType(row.event_type),
    severity: normalizeEventSeverity(row.severity),
    actor: row.actor,
    message: row.message,
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
  }
}

function compactMetadata(metadata: unknown): JsonObject {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as JsonObject
    : {}
}

async function queryConnectionById(
  client: Pick<SQLClient, 'query'>,
  id: string,
  tenantId: number,
): Promise<IntegrationConnection | null> {
  const result = await client.query(
    `SELECT *
     FROM integrations.connections
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId],
  )
  const row = result.rows[0] as DbConnectionRow | undefined
  return row ? toConnection(row) : null
}

async function queryDestinationById(
  client: Pick<SQLClient, 'query'>,
  id: string,
  tenantId: number,
): Promise<IntegrationDestination | null> {
  const result = await client.query(
    `SELECT *
     FROM integrations.destinations
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId],
  )
  const row = result.rows[0] as DbDestinationRow | undefined
  return row ? toDestination(row) : null
}

async function ensureDefaultBigQueryDestination(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
): Promise<IntegrationDestination> {
  const existing = await client.query(
    `SELECT *
     FROM integrations.destinations
     WHERE tenant_id = $1
       AND type = 'bigquery'
       AND (metadata->>'isDefault') = 'true'
     ORDER BY id ASC
     LIMIT 1`,
    [tenantId],
  )
  const existingRow = existing.rows[0] as DbDestinationRow | undefined
  if (existingRow) return toDestination(existingRow)

  const result = await client.query(
    `INSERT INTO integrations.destinations
      (tenant_id, type, name, status, config, metadata, updated_at)
     VALUES
      ($1, 'bigquery', 'BigQuery padrao', 'active', $2::jsonb, $3::jsonb, now())
     RETURNING *`,
    [
      tenantId,
      JSON.stringify({
        projectId: process.env.GCP_PROJECT_ID || 'creatto-463117',
        rawDataset: process.env.BIGQUERY_CUSTOM_RAW_DATASET || 'integrations_custom_raw',
        normalizedDataset: process.env.BIGQUERY_NORMALIZED_DATASET || 'integrations_normalized',
      }),
      JSON.stringify({ isDefault: true, createdBy: 'integracoes-api' }),
    ],
  )
  return toDestination(result.rows[0] as DbDestinationRow)
}

async function insertIntegrationPipeline(
  client: Pick<SQLClient, 'query'>,
  input: CreateIntegrationPipelineInput,
): Promise<IntegrationPipeline | null> {
  const tenantId = Number(input.tenantId || 1)
  const connection = await queryConnectionById(client, input.sourceConnectionId, tenantId)
  if (!connection) return null
  const destination = await queryDestinationById(client, input.destinationId, tenantId)
  if (!destination) return null

  const provider = requireIntegrationProvider(connection.provider)
  const selectedResources = normalizeRequestedResources(provider, input.selectedResources || connection.selectedResources)
  const name = String(input.name || `${connection.displayName} -> ${destination.name}`).trim()

  const result = await client.query(
    `INSERT INTO integrations.pipelines
      (tenant_id, source_connection_id, destination_id, name, status, selected_resources, sync_frequency, sync_enabled, next_sync_at, metadata, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, now())
     RETURNING *`,
    [
      tenantId,
      input.sourceConnectionId,
      input.destinationId,
      name || `${connection.displayName} -> ${destination.name}`,
      input.status || 'active',
      JSON.stringify(selectedResources),
      input.syncFrequency || 'manual',
      input.syncEnabled ?? true,
      input.nextSyncAt || null,
      JSON.stringify(input.metadata || {}),
    ],
  )

  return toPipeline(result.rows[0] as DbPipelineRow)
}

async function insertIntegrationEvent(
  client: Pick<SQLClient, 'query'>,
  input: CreateIntegrationEventInput,
): Promise<IntegrationEvent> {
  const result = await client.query(
    `INSERT INTO integrations.events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      Number(input.tenantId || 1),
      input.connectionId || null,
      normalizeEventType(input.eventType),
      normalizeEventSeverity(input.severity || 'info'),
      input.actor || null,
      input.message,
      JSON.stringify(compactMetadata(input.metadata)),
    ],
  )

  return toEvent(result.rows[0] as DbEventRow)
}

export async function createIntegrationEvent(input: CreateIntegrationEventInput): Promise<IntegrationEvent> {
  return withTransaction((client) => insertIntegrationEvent(client, input))
}

export async function listIntegrationDestinations(params?: {
  tenantId?: number
  type?: IntegrationDestinationType
  status?: IntegrationDestinationStatus
  limit?: number
}): Promise<IntegrationDestination[]> {
  const tenantId = Number(params?.tenantId || 1)
  const conditions = ['tenant_id = $1']
  const values: unknown[] = [tenantId]

  if (params?.type) {
    values.push(params.type)
    conditions.push(`type = $${values.length}`)
  }
  if (params?.status) {
    values.push(params.status)
    conditions.push(`status = $${values.length}`)
  }

  const limit = Math.min(Math.max(Number(params?.limit || 100), 1), 200)
  values.push(limit)

  const rows = await runQuery<DbDestinationRow>(
    `SELECT *
     FROM integrations.destinations
     WHERE ${conditions.join(' AND ')}
     ORDER BY updated_at DESC, id DESC
     LIMIT $${values.length}`,
    values,
  )
  return rows.map(toDestination)
}

export async function createIntegrationDestination(
  input: CreateIntegrationDestinationInput,
): Promise<IntegrationDestination> {
  const result = await runQuery<DbDestinationRow>(
    `INSERT INTO integrations.destinations
      (tenant_id, type, name, status, config, secret_ref, metadata, updated_at)
     VALUES
      ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, now())
     RETURNING *`,
    [
      Number(input.tenantId || 1),
      normalizeDestinationType(input.type),
      input.name,
      normalizeDestinationStatus(input.status),
      JSON.stringify(input.config || {}),
      input.secretRef || null,
      JSON.stringify(input.metadata || {}),
    ],
  )
  return toDestination(result[0])
}

export async function updateIntegrationDestination(
  id: string,
  tenantId: number,
  input: UpdateIntegrationDestinationInput,
): Promise<IntegrationDestination | null> {
  const current = await runQuery<DbDestinationRow>(
    `SELECT *
     FROM integrations.destinations
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId],
  )
  const row = current[0]
  if (!row) return null

  const result = await runQuery<DbDestinationRow>(
    `UPDATE integrations.destinations
     SET
       name = $3,
       status = $4,
       config = $5::jsonb,
       secret_ref = $6,
       metadata = $7::jsonb,
       updated_at = now()
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
    [
      id,
      tenantId,
      input.name == null ? row.name : input.name,
      input.status == null ? row.status : normalizeDestinationStatus(input.status),
      JSON.stringify(input.config == null ? asJsonObject(row.config) : input.config),
      input.secretRef === undefined ? row.secret_ref : input.secretRef,
      JSON.stringify(input.metadata ? { ...asJsonObject(row.metadata), ...input.metadata } : asJsonObject(row.metadata)),
    ],
  )
  return result[0] ? toDestination(result[0]) : null
}

export async function listIntegrationPipelines(params?: {
  tenantId?: number
  sourceConnectionId?: string
  destinationId?: string
  status?: IntegrationPipelineStatus
  limit?: number
}): Promise<IntegrationPipeline[]> {
  const tenantId = Number(params?.tenantId || 1)
  const conditions = ['tenant_id = $1']
  const values: unknown[] = [tenantId]

  if (params?.sourceConnectionId) {
    values.push(params.sourceConnectionId)
    conditions.push(`source_connection_id = $${values.length}`)
  }
  if (params?.destinationId) {
    values.push(params.destinationId)
    conditions.push(`destination_id = $${values.length}`)
  }
  if (params?.status) {
    values.push(params.status)
    conditions.push(`status = $${values.length}`)
  }

  const limit = Math.min(Math.max(Number(params?.limit || 100), 1), 200)
  values.push(limit)

  const rows = await runQuery<DbPipelineRow>(
    `SELECT *
     FROM integrations.pipelines
     WHERE ${conditions.join(' AND ')}
     ORDER BY updated_at DESC, id DESC
     LIMIT $${values.length}`,
    values,
  )
  return rows.map(toPipeline)
}

export async function createIntegrationPipeline(
  input: CreateIntegrationPipelineInput,
): Promise<IntegrationPipeline | null> {
  return withTransaction((client) => insertIntegrationPipeline(client, input))
}

export async function updateIntegrationPipeline(
  id: string,
  tenantId: number,
  input: UpdateIntegrationPipelineInput,
): Promise<IntegrationPipeline | null> {
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT *
       FROM integrations.pipelines
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [id, tenantId],
    )
    const row = current.rows[0] as DbPipelineRow | undefined
    if (!row) return null

    const connection = await queryConnectionById(client, String(row.source_connection_id), tenantId)
    if (!connection) return null
    const provider = requireIntegrationProvider(connection.provider)
    const selectedResources = input.selectedResources
      ? normalizeRequestedResources(provider, input.selectedResources)
      : asStringArray(row.selected_resources)

    const result = await client.query(
      `UPDATE integrations.pipelines
       SET
         name = $3,
         status = $4,
         selected_resources = $5::jsonb,
         sync_frequency = $6,
         sync_enabled = $7,
         next_sync_at = $8,
         metadata = $9::jsonb,
         updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        input.name == null ? row.name : input.name,
        input.status == null ? row.status : normalizePipelineStatus(input.status),
        JSON.stringify(selectedResources),
        input.syncFrequency || row.sync_frequency,
        input.syncEnabled == null ? row.sync_enabled : Boolean(input.syncEnabled),
        input.nextSyncAt === undefined ? row.next_sync_at : input.nextSyncAt,
        JSON.stringify(input.metadata ? { ...asJsonObject(row.metadata), ...input.metadata } : asJsonObject(row.metadata)),
      ],
    )
    return toPipeline(result.rows[0] as DbPipelineRow)
  })
}

export async function getIntegrationMcpPermissions(
  connectionId: string,
  tenantId = 1,
): Promise<IntegrationMcpPermissions | null> {
  const rows = await runQuery<DbMcpPermissionsRow>(
    `SELECT *
     FROM integrations.mcp_permissions
     WHERE connection_id = $1 AND tenant_id = $2
     LIMIT 1`,
    [connectionId, tenantId],
  )
  return rows[0] ? toMcpPermissions(rows[0]) : null
}

export async function upsertIntegrationMcpPermissions(
  input: UpsertIntegrationMcpPermissionsInput,
): Promise<IntegrationMcpPermissions> {
  const tenantId = Number(input.tenantId || 1)
  const result = await runQuery<DbMcpPermissionsRow>(
    `INSERT INTO integrations.mcp_permissions
      (tenant_id, connection_id, enabled, read_resources, write_resources, destructive_resources, require_confirmation, metadata, updated_at)
     VALUES
      ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8::jsonb, now())
     ON CONFLICT (tenant_id, connection_id)
     DO UPDATE SET
       enabled = EXCLUDED.enabled,
       read_resources = EXCLUDED.read_resources,
       write_resources = EXCLUDED.write_resources,
       destructive_resources = EXCLUDED.destructive_resources,
       require_confirmation = EXCLUDED.require_confirmation,
       metadata = integrations.mcp_permissions.metadata || EXCLUDED.metadata,
       updated_at = now()
     RETURNING *`,
    [
      tenantId,
      input.connectionId,
      input.enabled ?? false,
      JSON.stringify(input.readResources || []),
      JSON.stringify(input.writeResources || []),
      JSON.stringify(input.destructiveResources || []),
      input.requireConfirmation ?? true,
      JSON.stringify(input.metadata || {}),
    ],
  )
  return toMcpPermissions(result[0])
}

export async function listIntegrationConnections(params?: {
  tenantId?: number
  domain?: string
  provider?: string
  status?: string
  limit?: number
}): Promise<IntegrationConnection[]> {
  const tenantId = Number(params?.tenantId || 1)
  const conditions = ['tenant_id = $1']
  const values: unknown[] = [tenantId]

  if (params?.domain) {
    values.push(params.domain)
    conditions.push(`domain = $${values.length}`)
  }
  if (params?.provider) {
    values.push(params.provider)
    conditions.push(`provider = $${values.length}`)
  }
  if (params?.status) {
    values.push(params.status)
    conditions.push(`status = $${values.length}`)
  }

  const limit = Math.min(Math.max(Number(params?.limit || 100), 1), 200)
  values.push(limit)

  const rows = await runQuery<DbConnectionRow>(
    `SELECT *
     FROM integrations.connections
     WHERE ${conditions.join(' AND ')}
     ORDER BY updated_at DESC, id DESC
     LIMIT $${values.length}`,
    values,
  )

  return rows.map(toConnection)
}

export async function getIntegrationConnection(id: string, tenantId = 1): Promise<IntegrationConnection | null> {
  const rows = await runQuery<DbConnectionRow>(
    `SELECT *
     FROM integrations.connections
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId],
  )
  return rows[0] ? toConnection(rows[0]) : null
}

export async function createIntegrationConnection(
  input: CreateIntegrationConnectionInput,
): Promise<IntegrationConnection> {
  const tenantId = Number(input.tenantId || 1)
  const provider = requireIntegrationProvider(input.provider)
  const selectedResources = normalizeRequestedResources(provider, input.selectedResources)
  const syncModes = input.syncModes?.length ? input.syncModes : provider.syncModes
  const displayName = String(input.displayName || provider.name).trim() || provider.name

  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO integrations.connections
        (tenant_id, domain, provider, display_name, status, auth_type, selected_resources, sync_frequency, sync_enabled, next_sync_at, sync_modes, metadata, updated_at)
       VALUES
        ($1, $2, $3, $4, 'pending_auth', $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, now())
       RETURNING *`,
      [
        tenantId,
        provider.domain,
        provider.slug,
        displayName,
        provider.authType,
        JSON.stringify(selectedResources),
        input.syncFrequency || 'manual',
        input.syncEnabled ?? true,
        input.nextSyncAt || null,
        JSON.stringify(syncModes),
        JSON.stringify({
          ...(input.metadata || {}),
          toolkitSlug: provider.toolkitSlug,
          setupMode: 'local_stub',
        }),
      ],
    )

    const connection = toConnection(result.rows[0] as DbConnectionRow)
    await insertIntegrationEvent(client, {
      tenantId,
      connectionId: connection.id,
      eventType: 'connection.created',
      actor: 'integracoes-api',
      message: `${provider.name} foi criada em modo local aguardando autenticacao.`,
      metadata: {
        provider: provider.slug,
        domain: provider.domain,
        selectedResources,
        syncFrequency: input.syncFrequency || 'manual',
      },
    })

    await client.query(
      `INSERT INTO integrations.mcp_permissions
        (tenant_id, connection_id, enabled, read_resources, write_resources, destructive_resources, require_confirmation, metadata, updated_at)
       VALUES
        ($1, $2, true, $3::jsonb, '[]'::jsonb, '[]'::jsonb, true, $4::jsonb, now())
       ON CONFLICT (tenant_id, connection_id)
       DO UPDATE SET
         enabled = EXCLUDED.enabled,
         read_resources = EXCLUDED.read_resources,
         metadata = integrations.mcp_permissions.metadata || EXCLUDED.metadata,
         updated_at = now()`,
      [
        tenantId,
        connection.id,
        JSON.stringify(selectedResources),
        JSON.stringify({
          createdBy: 'connection_create',
          defaultReadGrant: true,
        }),
      ],
    )

    if (selectedResources.length && (input.syncFrequency || 'manual') !== 'manual') {
      const destination = await ensureDefaultBigQueryDestination(client, tenantId)
      await insertIntegrationPipeline(client, {
        tenantId,
        sourceConnectionId: connection.id,
        destinationId: destination.id,
        name: `${connection.displayName} -> ${destination.name}`,
        status: connection.status === 'connected' || connection.status === 'warning' ? 'active' : 'draft',
        selectedResources,
        syncFrequency: input.syncFrequency || 'manual',
        syncEnabled: input.syncEnabled ?? true,
        nextSyncAt: input.nextSyncAt || null,
        metadata: {
          createdBy: 'connection_create',
          legacyConnectionSchedule: true,
        },
      })
    }

    return connection
  })
}

export async function updateIntegrationConnection(
  id: string,
  tenantId: number,
  input: UpdateIntegrationConnectionInput,
): Promise<IntegrationConnection | null> {
  return withTransaction(async (client) => {
    const current = await queryConnectionById(client, id, tenantId)
    if (!current) return null

    const provider = requireIntegrationProvider(current.provider)
    const displayName = input.displayName == null ? current.displayName : String(input.displayName).trim()
    const status = input.status ? normalizeConnectionStatus(input.status) : current.status
    const selectedResources = input.selectedResources
      ? normalizeRequestedResources(provider, input.selectedResources)
      : current.selectedResources
    const syncModes = input.syncModes?.length ? input.syncModes : current.syncModes
    const syncEnabled = input.syncEnabled == null ? current.syncEnabled !== false : Boolean(input.syncEnabled)
    const nextSyncAt = input.nextSyncAt === undefined ? current.nextSyncAt : input.nextSyncAt
    const metadata = input.metadata ? { ...(current.metadata || {}), ...compactMetadata(input.metadata) } : current.metadata || {}

    const result = await client.query(
      `UPDATE integrations.connections
       SET
         display_name = $3,
         status = $4,
         selected_resources = $5::jsonb,
         sync_frequency = $6,
         sync_enabled = $7,
         next_sync_at = $8,
         sync_modes = $9::jsonb,
         metadata = $10::jsonb,
         updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        displayName || current.displayName,
        status,
        JSON.stringify(selectedResources),
        input.syncFrequency || current.syncFrequency,
        syncEnabled,
        nextSyncAt || null,
        JSON.stringify(syncModes),
        JSON.stringify(metadata),
      ],
    )

    const row = result.rows[0] as DbConnectionRow | undefined
    if (!row) return null

    const connection = toConnection(row)
    if (input.selectedResources) {
      await client.query(
        `UPDATE integrations.mcp_permissions
         SET
           read_resources = $3::jsonb,
           metadata = metadata || $4::jsonb,
           updated_at = now()
         WHERE tenant_id = $1 AND connection_id = $2`,
        [
          tenantId,
          connection.id,
          JSON.stringify(selectedResources),
          JSON.stringify({
            resourcesSyncedFromConnectionAt: new Date().toISOString(),
          }),
        ],
      )
    }

    await insertIntegrationEvent(client, {
      tenantId,
      connectionId: connection.id,
      eventType: 'connection.updated',
      actor: 'integracoes-api',
      message: 'Configuracao da conexao atualizada.',
      metadata: {
        changedFields: Object.keys(input).filter((key) => input[key as keyof UpdateIntegrationConnectionInput] !== undefined),
        status,
        syncFrequency: input.syncFrequency || current.syncFrequency,
      },
    })

    return connection
  })
}

export async function listIntegrationEvents(params: {
  tenantId?: number
  connectionId?: string
  limit?: number
}): Promise<IntegrationEvent[]> {
  const tenantId = Number(params.tenantId || 1)
  const limit = Math.min(Math.max(Number(params.limit || 30), 1), 100)
  const conditions = ['tenant_id = $1']
  const values: unknown[] = [tenantId]

  if (params.connectionId) {
    values.push(params.connectionId)
    conditions.push(`connection_id = $${values.length}`)
  }

  values.push(limit)

  const rows = await runQuery<DbEventRow>(
    `SELECT *
     FROM integrations.events
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC
     LIMIT $${values.length}`,
    values,
  )

  return rows.map(toEvent)
}

export async function listIntegrationSyncRuns(params: {
  tenantId?: number
  connectionId: string
  limit?: number
}): Promise<IntegrationSyncRun[]> {
  const tenantId = Number(params.tenantId || 1)
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100)
  const rows = await runQuery<DbSyncRunRow>(
    `SELECT *
     FROM integrations.sync_runs
     WHERE tenant_id = $1 AND connection_id = $2
     ORDER BY created_at DESC, id DESC
     LIMIT $3`,
    [tenantId, params.connectionId, limit],
  )

  return rows.map(toSyncRun)
}

export async function createIntegrationSyncRun(params: {
  tenantId?: number
  connectionId: string
  pipelineId?: string | null
  destinationId?: string | null
  trigger: IntegrationSyncTrigger
  status?: IntegrationSyncRunStatus
  resources?: string[]
  metadata?: JsonObject
}): Promise<IntegrationSyncRun | null> {
  const tenantId = Number(params.tenantId || 1)
  const status = params.status || 'success'

  return withTransaction(async (client) => {
    const connection = await queryConnectionById(client, params.connectionId, tenantId)
    if (!connection) return null

    await insertIntegrationEvent(client, {
      tenantId,
      connectionId: params.connectionId,
      eventType: 'sync.requested',
      actor: String(params.metadata?.requestedBy || 'api'),
      message: 'Sincronizacao local solicitada.',
      metadata: {
        trigger: params.trigger,
        resources: params.resources || connection.selectedResources,
        setupMode: params.metadata?.setupMode,
      },
    })

    const result = await client.query(
      `INSERT INTO integrations.sync_runs
        (tenant_id, connection_id, pipeline_id, destination_id, trigger, status, started_at, finished_at, records_in, records_updated, records_failed, metadata)
       VALUES
        ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'queued' THEN NULL ELSE now() END, CASE WHEN $6 = 'queued' THEN NULL ELSE now() END, 0, 0, 0, $7::jsonb)
       RETURNING *`,
      [
        tenantId,
        params.connectionId,
        params.pipelineId || null,
        params.destinationId || null,
        params.trigger,
        status,
        JSON.stringify({
          simulated: status !== 'queued',
          resources: params.resources || connection.selectedResources,
          ...(params.metadata || {}),
        }),
      ],
    )

    await client.query(
      `UPDATE integrations.connections
       SET
         last_sync_at = now(),
         last_success_at = CASE WHEN $3 = 'success' THEN now() ELSE last_success_at END,
         last_error = CASE WHEN $3 = 'success' THEN NULL ELSE last_error END,
         status = CASE
           WHEN status IN ('draft', 'pending_auth') THEN status
           WHEN $3 = 'success' THEN 'connected'
           WHEN $3 = 'error' THEN 'error'
           ELSE status
         END,
         updated_at = now()
       WHERE id = $1 AND tenant_id = $2`,
      [params.connectionId, tenantId, status],
    )

    const row = result.rows[0] as DbSyncRunRow | undefined
    if (!row) return null

    const run = toSyncRun(row)
    if (status !== 'queued' && status !== 'running') {
      await insertIntegrationEvent(client, {
        tenantId,
        connectionId: params.connectionId,
        eventType: status === 'error' ? 'sync.failed' : 'sync.completed',
        severity: status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'info',
        actor: String(params.metadata?.requestedBy || 'api'),
        message: status === 'error' ? 'Sincronizacao local terminou com erro.' : 'Sincronizacao local concluida.',
        metadata: {
          runId: run.id,
          status: run.status,
          recordsIn: run.recordsIn,
          recordsUpdated: run.recordsUpdated,
          recordsFailed: run.recordsFailed,
        },
      })
    }

    return run
  })
}
