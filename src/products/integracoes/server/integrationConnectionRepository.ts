import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import type {
  CreateIntegrationConnectionInput,
  IntegrationConnection,
  UpdateIntegrationConnectionInput,
} from '@/products/integracoes/shared/contracts/connectionContracts'
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
  sync_modes_json: unknown
  last_sync_at: string | Date | null
  last_success_at: string | Date | null
  last_error: string | null
  records_synced: number
  metadata_json: unknown
  created_at: string | Date
  updated_at: string | Date
}

type DbSyncRunRow = {
  id: string | number
  tenant_id: number
  connection_id: string | number
  trigger: string
  status: string
  resource: string | null
  started_at: string | Date | null
  finished_at: string | Date | null
  records_in: number
  records_updated: number
  records_failed: number
  error_message: string | null
  metadata_json: unknown
  created_at: string | Date
}

type DbEventRow = {
  id: string | number
  tenant_id: number
  connection_id: string | number | null
  event_type: string
  severity: string
  actor: string | null
  message: string
  metadata_json: unknown
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
    syncModes: asStringArray(row.sync_modes_json) as IntegrationSyncMode[],
    lastSyncAt: toIsoString(row.last_sync_at),
    lastSuccessAt: toIsoString(row.last_success_at),
    lastError: row.last_error,
    recordsSynced: Number(row.records_synced || 0),
    metadata: asJsonObject(row.metadata_json),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function toSyncRun(row: DbSyncRunRow): IntegrationSyncRun {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    connectionId: String(row.connection_id),
    trigger: row.trigger as IntegrationSyncTrigger,
    status: normalizeSyncRunStatus(row.status),
    startedAt: toIsoString(row.started_at),
    finishedAt: toIsoString(row.finished_at),
    resource: row.resource,
    recordsIn: Number(row.records_in || 0),
    recordsUpdated: Number(row.records_updated || 0),
    recordsFailed: Number(row.records_failed || 0),
    errorMessage: row.error_message,
    metadata: asJsonObject(row.metadata_json),
    createdAt: toIsoString(row.created_at) || '',
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
    metadata: asJsonObject(row.metadata_json),
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
     FROM mcp_app.integration_connections
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId],
  )
  const row = result.rows[0] as DbConnectionRow | undefined
  return row ? toConnection(row) : null
}

async function insertIntegrationEvent(
  client: Pick<SQLClient, 'query'>,
  input: CreateIntegrationEventInput,
): Promise<IntegrationEvent> {
  const result = await client.query(
    `INSERT INTO mcp_app.integration_events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata_json)
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
     FROM mcp_app.integration_connections
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
     FROM mcp_app.integration_connections
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
      `INSERT INTO mcp_app.integration_connections
        (tenant_id, domain, provider, display_name, status, auth_type, selected_resources, sync_frequency, sync_modes_json, metadata_json, updated_at)
       VALUES
        ($1, $2, $3, $4, 'pending_auth', $5, $6::jsonb, $7, $8::jsonb, $9::jsonb, now())
       RETURNING *`,
      [
        tenantId,
        provider.domain,
        provider.slug,
        displayName,
        provider.authType,
        JSON.stringify(selectedResources),
        input.syncFrequency || 'manual',
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
    const metadata = input.metadata ? { ...(current.metadata || {}), ...compactMetadata(input.metadata) } : current.metadata || {}

    const result = await client.query(
      `UPDATE mcp_app.integration_connections
       SET
         display_name = $3,
         status = $4,
         selected_resources = $5::jsonb,
         sync_frequency = $6,
         sync_modes_json = $7::jsonb,
         metadata_json = $8::jsonb,
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
        JSON.stringify(syncModes),
        JSON.stringify(metadata),
      ],
    )

    const row = result.rows[0] as DbConnectionRow | undefined
    if (!row) return null

    const connection = toConnection(row)
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
     FROM mcp_app.integration_events
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
     FROM mcp_app.integration_sync_runs
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
      `INSERT INTO mcp_app.integration_sync_runs
        (tenant_id, connection_id, trigger, status, started_at, finished_at, records_in, records_updated, records_failed, metadata_json)
       VALUES
        ($1, $2, $3, $4, CASE WHEN $4 = 'queued' THEN NULL ELSE now() END, CASE WHEN $4 = 'queued' THEN NULL ELSE now() END, 0, 0, 0, $5::jsonb)
       RETURNING *`,
      [
        tenantId,
        params.connectionId,
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
      `UPDATE mcp_app.integration_connections
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
