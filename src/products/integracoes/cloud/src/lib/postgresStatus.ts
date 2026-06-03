import { Pool } from 'pg'

export type CloudIntegrationConnection = {
  id: string
  tenantId: number
  domain: string
  provider: string
  status: string
  displayName: string
  secretRef: string | null
  selectedResources: string[]
  metadata: Record<string, unknown>
}

export type CloudSyncRun = {
  id: string
  status: string
}

let pool: InstanceType<typeof Pool> | null = null

function getDatabaseUrl() {
  return process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim() || ''
}

function getPool() {
  const connectionString = getDatabaseUrl()
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL ou DATABASE_URL precisa estar configurada no Cloud Run.')
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.POSTGRES_POOL_MAX || 3),
    })
  }

  return pool
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') {
    try {
      return asStringArray(JSON.parse(value) as unknown)
    } catch {
      return []
    }
  }
  return []
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }
  return {}
}

function normalizeStatus(value: string) {
  if (value === 'success' || value === 'warning' || value === 'error' || value === 'cancelled') return value
  if (value === 'running' || value === 'queued') return value
  return 'error'
}

function eventForStatus(status: string) {
  if (status === 'success' || status === 'warning') return 'sync.completed'
  if (status === 'error') return 'sync.failed'
  return 'system.note'
}

export async function getCloudIntegrationConnection(input: {
  tenantId: number
  connectionId: string
}): Promise<CloudIntegrationConnection | null> {
  const result = await getPool().query(
    `SELECT *
     FROM mcp_app.integration_connections
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [input.connectionId, input.tenantId],
  )
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    domain: String(row.domain || ''),
    provider: String(row.provider || ''),
    status: String(row.status || ''),
    displayName: String(row.display_name || ''),
    secretRef: row.secret_ref == null ? null : String(row.secret_ref),
    selectedResources: asStringArray(row.selected_resources),
    metadata: asRecord(row.metadata_json),
  }
}

export async function startCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  runId?: string | null
  trigger: string
  resources: string[]
  requestedBy?: string | null
}): Promise<CloudSyncRun> {
  if (input.runId) {
    const result = await getPool().query(
      `UPDATE mcp_app.integration_sync_runs
       SET
         status = 'running',
         started_at = COALESCE(started_at, now()),
         metadata_json = metadata_json || $4::jsonb
       WHERE id = $1 AND tenant_id = $2 AND connection_id = $3
       RETURNING id::text, status`,
      [
        input.runId,
        input.tenantId,
        input.connectionId,
        JSON.stringify({
          mode: 'gcp_worker',
          resources: input.resources,
          requestedBy: input.requestedBy || 'worker',
          workerStartedAt: new Date().toISOString(),
        }),
      ],
    )

    const row = result.rows[0] as { id?: unknown, status?: unknown } | undefined
    if (row?.id) {
      return {
        id: String(row.id),
        status: String(row.status || 'running'),
      }
    }
  }

  const result = await getPool().query(
    `INSERT INTO mcp_app.integration_sync_runs
      (tenant_id, connection_id, trigger, status, started_at, metadata_json)
     VALUES
      ($1, $2, $3, 'running', now(), $4::jsonb)
     RETURNING id::text, status`,
    [
      input.tenantId,
      input.connectionId,
      input.trigger,
      JSON.stringify({
        mode: 'gcp_worker',
        resources: input.resources,
        requestedBy: input.requestedBy || 'worker',
      }),
    ],
  )

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: 'sync.requested',
    severity: 'info',
    actor: input.requestedBy || 'integrations-worker',
    message: 'Sincronizacao enviada ao worker GCP.',
    metadata: { resources: input.resources, trigger: input.trigger },
  })

  return {
    id: String(result.rows[0]?.id),
    status: String(result.rows[0]?.status),
  }
}

export async function finishCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  runId: string
  status: 'success' | 'warning' | 'error'
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}) {
  const status = normalizeStatus(input.status)
  await getPool().query(
    `UPDATE mcp_app.integration_sync_runs
     SET
       status = $4,
       finished_at = now(),
       records_in = $5,
       records_updated = $6,
       records_failed = $7,
       error_message = $8,
       metadata_json = metadata_json || $9::jsonb
     WHERE id = $1 AND tenant_id = $2 AND connection_id = $3`,
    [
      input.runId,
      input.tenantId,
      input.connectionId,
      status,
      input.recordsIn,
      input.recordsUpdated,
      input.recordsFailed,
      input.errorMessage || null,
      JSON.stringify(input.metadata || {}),
    ],
  )

  await getPool().query(
    `UPDATE mcp_app.integration_connections
     SET
       last_sync_at = now(),
       last_success_at = CASE WHEN $3 IN ('success', 'warning') THEN now() ELSE last_success_at END,
       last_error = CASE WHEN $3 IN ('success', 'warning') THEN NULL ELSE $4 END,
       records_synced = CASE WHEN $3 IN ('success', 'warning') THEN records_synced + $5 ELSE records_synced END,
       status = CASE
         WHEN $3 = 'success' THEN 'connected'
         WHEN $3 = 'warning' THEN 'warning'
         WHEN $3 = 'error' THEN 'error'
         ELSE status
       END,
       updated_at = now()
     WHERE id = $1 AND tenant_id = $2`,
    [input.connectionId, input.tenantId, status, input.errorMessage || null, input.recordsUpdated],
  )

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: eventForStatus(status),
    severity: status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'info',
    actor: 'integrations-worker',
    message: status === 'error' ? 'Sincronizacao GCP falhou.' : 'Sincronizacao GCP concluida.',
    metadata: {
      runId: input.runId,
      recordsIn: input.recordsIn,
      recordsUpdated: input.recordsUpdated,
      recordsFailed: input.recordsFailed,
      errorMessage: input.errorMessage || null,
      ...(input.metadata || {}),
    },
  })
}

export async function readIntegrationCursor(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursorKey?: string
}): Promise<Record<string, unknown> | undefined> {
  const result = await getPool().query(
    `SELECT cursor_json
     FROM mcp_app.integration_sync_cursors
     WHERE tenant_id = $1 AND connection_id = $2 AND resource = $3 AND cursor_key = $4
     LIMIT 1`,
    [input.tenantId, input.connectionId, input.resource, input.cursorKey || 'default'],
  )
  const row = result.rows[0] as { cursor_json?: unknown } | undefined
  return row ? asRecord(row.cursor_json) : undefined
}

export async function writeIntegrationCursor(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursor: Record<string, unknown>
  cursorKey?: string
}) {
  await getPool().query(
    `INSERT INTO mcp_app.integration_sync_cursors
      (tenant_id, connection_id, resource, cursor_key, cursor_value, cursor_json, last_synced_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, now(), now())
     ON CONFLICT (tenant_id, connection_id, resource, cursor_key)
     DO UPDATE SET
       cursor_value = EXCLUDED.cursor_value,
       cursor_json = EXCLUDED.cursor_json,
       last_synced_at = now(),
       updated_at = now()`,
    [
      input.tenantId,
      input.connectionId,
      input.resource,
      input.cursorKey || 'default',
      input.cursor.updatedAt || input.cursor.updated_at || input.cursor.next || null,
      JSON.stringify(input.cursor),
    ],
  )
}

export async function updateConnectionSecret(input: {
  tenantId: number
  connectionId: string
  secretRef: string
  status: string
  metadata?: Record<string, unknown>
}) {
  await getPool().query(
    `UPDATE mcp_app.integration_connections
     SET
       secret_ref = $3,
       status = $4,
       metadata_json = metadata_json || $5::jsonb,
       updated_at = now()
     WHERE id = $1 AND tenant_id = $2`,
    [
      input.connectionId,
      input.tenantId,
      input.secretRef,
      input.status,
      JSON.stringify(input.metadata || {}),
    ],
  )
}

export async function createIntegrationEvent(input: {
  tenantId: number
  connectionId?: string | null
  eventType: string
  severity?: 'info' | 'warning' | 'error'
  actor?: string | null
  message: string
  metadata?: Record<string, unknown>
}) {
  await getPool().query(
    `INSERT INTO mcp_app.integration_events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata_json)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      input.tenantId,
      input.connectionId || null,
      input.eventType,
      input.severity || 'info',
      input.actor || null,
      input.message,
      JSON.stringify(input.metadata || {}),
    ],
  )
}

export async function updateConnectionStatus(input: {
  connectionId: string
  tenantId: number
  status: string
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; mode: 'postgres' }> {
  await getPool().query(
    `UPDATE mcp_app.integration_connections
     SET status = $3, metadata_json = metadata_json || $4::jsonb, updated_at = now()
     WHERE id = $1 AND tenant_id = $2`,
    [input.connectionId, input.tenantId, input.status, JSON.stringify(input.metadata || {})],
  )
  return { ok: true, mode: 'postgres' }
}
