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
  syncFrequency: string
  metadata: Record<string, unknown>
}

export type CloudSyncRun = {
  id: string
  status: string
}

export type CloudSyncDispatchOutboxItem = {
  id: string
  tenantId: number
  connectionId: string
  pipelineId: string | null
  destinationId: string | null
  runId: string
  trigger: string
  payload: Record<string, unknown>
}

export type CloudIntegrationDestination = {
  id: string
  tenantId: number
  type: string
  name: string
  status: string
  config: Record<string, unknown>
  secretRef: string | null
  metadata: Record<string, unknown>
}

export type CloudIntegrationPipeline = {
  id: string
  tenantId: number
  sourceConnectionId: string
  destinationId: string
  name: string
  status: string
  selectedResources: string[]
  syncFrequency: string
  nextSyncAt: string | null
  metadata: Record<string, unknown>
}

export type ScheduledCloudIntegrationPipeline = CloudIntegrationPipeline & {
  provider: string
}

export type ScheduledCloudIntegrationConnection = {
  id: string
  tenantId: number
  provider: string
  selectedResources: string[]
  syncFrequency: string
  nextSyncAt: string | null
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
     FROM integrations.connections
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
    syncFrequency: String(row.sync_frequency || 'manual'),
    metadata: asRecord(row.metadata),
  }
}

export async function getCloudIntegrationDestination(input: {
  tenantId: number
  destinationId: string
}): Promise<CloudIntegrationDestination | null> {
  const result = await getPool().query(
    `SELECT *
     FROM integrations.destinations
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [input.destinationId, input.tenantId],
  )
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    type: String(row.type || ''),
    name: String(row.name || ''),
    status: String(row.status || ''),
    config: asRecord(row.config),
    secretRef: row.secret_ref == null ? null : String(row.secret_ref),
    metadata: asRecord(row.metadata),
  }
}

export async function getCloudIntegrationPipeline(input: {
  tenantId: number
  pipelineId: string
}): Promise<CloudIntegrationPipeline | null> {
  const result = await getPool().query(
    `SELECT *
     FROM integrations.pipelines
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [input.pipelineId, input.tenantId],
  )
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    sourceConnectionId: String(row.source_connection_id),
    destinationId: String(row.destination_id),
    name: String(row.name || ''),
    status: String(row.status || ''),
    selectedResources: asStringArray(row.selected_resources),
    syncFrequency: String(row.sync_frequency || ''),
    nextSyncAt: row.next_sync_at == null ? null : new Date(row.next_sync_at as string | Date).toISOString(),
    metadata: asRecord(row.metadata),
  }
}

export async function startCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  pipelineId?: string | null
  destinationId?: string | null
  runId?: string | null
  trigger: string
  resources: string[]
  requestedBy?: string | null
}): Promise<CloudSyncRun> {
  if (input.runId) {
    const result = await getPool().query(
      `UPDATE integrations.sync_runs
       SET
         status = 'running',
         started_at = COALESCE(started_at, now()),
         metadata = metadata || $4::jsonb
       WHERE id = $1 AND tenant_id = $2 AND connection_id = $3
         AND status = 'queued'
       RETURNING id::text, status`,
      [
        input.runId,
        input.tenantId,
        input.connectionId,
        JSON.stringify({
          mode: 'gcp_worker',
          pipelineId: input.pipelineId || null,
          destinationId: input.destinationId || null,
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

    const existing = await getPool().query(
      `SELECT id::text, status
       FROM integrations.sync_runs
       WHERE id = $1 AND tenant_id = $2 AND connection_id = $3
       LIMIT 1`,
      [input.runId, input.tenantId, input.connectionId],
    )
    const existingRow = existing.rows[0] as { id?: unknown, status?: unknown } | undefined
    if (existingRow?.id) {
      const status = String(existingRow.status || 'already_processed')
      return {
        id: String(existingRow.id),
        status: status === 'running' ? 'already_running' : status,
      }
    }
  }

  const result = await getPool().query(
    `INSERT INTO integrations.sync_runs
      (tenant_id, connection_id, pipeline_id, destination_id, trigger, status, started_at, metadata)
     VALUES
      ($1, $2, $3, $4, $5, 'running', now(), $6::jsonb)
     RETURNING id::text, status`,
    [
      input.tenantId,
      input.connectionId,
      input.pipelineId || null,
      input.destinationId || null,
      input.trigger,
      JSON.stringify({
        mode: 'gcp_worker',
        pipelineId: input.pipelineId || null,
        destinationId: input.destinationId || null,
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

export async function claimDueScheduledConnections(input: {
  limit: number
  lockToken: string
  lockOwner: string
  lockTtlSeconds: number
  syncFrequencies: string[]
}): Promise<ScheduledCloudIntegrationConnection[]> {
  const result = await getPool().query(
    `WITH due_connections AS (
       SELECT id, tenant_id
       FROM integrations.connections
       WHERE
         sync_enabled = true
         AND sync_frequency = ANY($5::text[])
         AND next_sync_at IS NOT NULL
         AND next_sync_at <= now()
         AND status IN ('connected', 'warning')
         AND jsonb_array_length(COALESCE(selected_resources, '[]'::jsonb)) > 0
         AND (sync_locked_until IS NULL OR sync_locked_until < now())
       ORDER BY next_sync_at ASC, updated_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE integrations.connections connections
     SET
       sync_lock_token = $2,
       sync_lock_owner = $3,
       sync_locked_until = now() + make_interval(secs => $4),
       updated_at = now()
     FROM due_connections
     WHERE connections.id = due_connections.id
       AND connections.tenant_id = due_connections.tenant_id
     RETURNING
       connections.id::text,
       connections.tenant_id,
       connections.provider,
       connections.selected_resources,
       connections.sync_frequency,
       connections.next_sync_at`,
    [
      input.limit,
      input.lockToken,
      input.lockOwner,
      input.lockTtlSeconds,
      input.syncFrequencies,
    ],
  )

  return result.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    provider: String(row.provider || ''),
    selectedResources: asStringArray(row.selected_resources),
    syncFrequency: String(row.sync_frequency || ''),
    nextSyncAt: row.next_sync_at == null ? null : new Date(row.next_sync_at as string | Date).toISOString(),
  }))
}

export async function claimDueScheduledPipelines(input: {
  limit: number
  lockToken: string
  lockOwner: string
  lockTtlSeconds: number
  syncFrequencies: string[]
}): Promise<ScheduledCloudIntegrationPipeline[]> {
  const result = await getPool().query(
    `WITH due_pipelines AS (
       SELECT pipelines.id, pipelines.tenant_id
       FROM integrations.pipelines pipelines
       JOIN integrations.connections connections
         ON connections.id = pipelines.source_connection_id
        AND connections.tenant_id = pipelines.tenant_id
       JOIN integrations.destinations destinations
         ON destinations.id = pipelines.destination_id
        AND destinations.tenant_id = pipelines.tenant_id
       WHERE
         pipelines.sync_enabled = true
         AND pipelines.sync_frequency = ANY($5::text[])
         AND pipelines.next_sync_at IS NOT NULL
         AND pipelines.next_sync_at <= now()
         AND pipelines.status = 'active'
         AND destinations.status = 'active'
         AND connections.status IN ('connected', 'warning')
         AND jsonb_array_length(COALESCE(pipelines.selected_resources, '[]'::jsonb)) > 0
         AND (pipelines.sync_locked_until IS NULL OR pipelines.sync_locked_until < now())
       ORDER BY pipelines.next_sync_at ASC, pipelines.updated_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE integrations.pipelines pipelines
     SET
       sync_lock_token = $2,
       sync_lock_owner = $3,
       sync_locked_until = now() + make_interval(secs => $4),
       updated_at = now()
     FROM due_pipelines
     JOIN integrations.connections connections
       ON connections.id = (
         SELECT source_connection_id
         FROM integrations.pipelines
         WHERE id = due_pipelines.id AND tenant_id = due_pipelines.tenant_id
       )
      AND connections.tenant_id = due_pipelines.tenant_id
     WHERE pipelines.id = due_pipelines.id
       AND pipelines.tenant_id = due_pipelines.tenant_id
     RETURNING
       pipelines.id::text,
       pipelines.tenant_id,
       pipelines.source_connection_id::text,
       pipelines.destination_id::text,
       pipelines.name,
       pipelines.status,
       pipelines.selected_resources,
       pipelines.sync_frequency,
       pipelines.next_sync_at,
       pipelines.metadata,
       connections.provider`,
    [
      input.limit,
      input.lockToken,
      input.lockOwner,
      input.lockTtlSeconds,
      input.syncFrequencies,
    ],
  )

  return result.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    sourceConnectionId: String(row.source_connection_id),
    destinationId: String(row.destination_id),
    name: String(row.name || ''),
    status: String(row.status || ''),
    selectedResources: asStringArray(row.selected_resources),
    syncFrequency: String(row.sync_frequency || ''),
    nextSyncAt: row.next_sync_at == null ? null : new Date(row.next_sync_at as string | Date).toISOString(),
    metadata: asRecord(row.metadata),
    provider: String(row.provider || ''),
  }))
}

export async function createQueuedCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  pipelineId?: string | null
  destinationId?: string | null
  resources: string[]
  requestedBy: string
  metadata?: Record<string, unknown>
}): Promise<CloudSyncRun> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO integrations.sync_runs
        (tenant_id, connection_id, pipeline_id, destination_id, trigger, status, started_at, finished_at, records_in, records_updated, records_failed, metadata)
       VALUES
        ($1, $2, $3, $4, 'scheduled', 'queued', NULL, NULL, 0, 0, 0, $5::jsonb)
       RETURNING id::text, status`,
      [
        input.tenantId,
        input.connectionId,
        input.pipelineId || null,
        input.destinationId || null,
        JSON.stringify({
          mode: 'scheduled_sync',
          pipelineId: input.pipelineId || null,
          destinationId: input.destinationId || null,
          resources: input.resources,
          requestedBy: input.requestedBy,
          ...(input.metadata || {}),
        }),
      ],
    )
    const runId = String(result.rows[0]?.id)
    await client.query(
      `INSERT INTO integrations.sync_dispatch_outbox
        (tenant_id, connection_id, pipeline_id, destination_id, run_id, trigger, payload)
       VALUES
        ($1, $2, $3, $4, $5, 'scheduled', $6::jsonb)
       ON CONFLICT (run_id) DO NOTHING`,
      [
        input.tenantId,
        input.connectionId,
        input.pipelineId || null,
        input.destinationId || null,
        runId,
        JSON.stringify({
          tenantId: input.tenantId,
          connectionId: input.connectionId,
          pipelineId: input.pipelineId || undefined,
          destinationId: input.destinationId || undefined,
          runId,
          trigger: 'scheduled',
          resources: input.resources,
          requestedBy: input.requestedBy,
        }),
      ],
    )

    await client.query(
      `INSERT INTO integrations.events
        (tenant_id, connection_id, event_type, severity, actor, message, metadata)
       VALUES
        ($1, $2, 'sync.requested', 'info', $3, 'Sincronizacao agendada enfileirada para dispatch.', $4::jsonb)`,
      [
        input.tenantId,
        input.connectionId,
        input.requestedBy,
        JSON.stringify({
          resources: input.resources,
          trigger: 'scheduled',
          runId,
          ...(input.metadata || {}),
        }),
      ],
    )
    await client.query('COMMIT')

    return {
      id: runId,
      status: String(result.rows[0]?.status || 'queued'),
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export async function claimSyncDispatchOutbox(input: {
  limit: number
  lockToken: string
  lockTtlSeconds: number
  runId?: string | null
}): Promise<CloudSyncDispatchOutboxItem[]> {
  const result = await getPool().query(
    `WITH due AS (
       SELECT id
       FROM integrations.sync_dispatch_outbox
       WHERE status IN ('pending', 'publishing')
         AND attempts < 10
         AND next_attempt_at <= now()
         AND (locked_until IS NULL OR locked_until <= now())
         AND ($4::bigint IS NULL OR run_id = $4::bigint)
       ORDER BY next_attempt_at ASC, id ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE integrations.sync_dispatch_outbox outbox
     SET
       status = 'publishing',
       lock_token = $2,
       locked_until = now() + ($3::int || ' seconds')::interval,
       attempts = attempts + 1,
       updated_at = now()
     FROM due
     WHERE outbox.id = due.id
     RETURNING
       outbox.id::text,
       outbox.tenant_id,
       outbox.connection_id::text,
       outbox.pipeline_id::text,
       outbox.destination_id::text,
       outbox.run_id::text,
       outbox.trigger,
       outbox.payload`,
    [input.limit, input.lockToken, input.lockTtlSeconds, input.runId || null],
  )
  return result.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    connectionId: String(row.connection_id),
    pipelineId: row.pipeline_id == null ? null : String(row.pipeline_id),
    destinationId: row.destination_id == null ? null : String(row.destination_id),
    runId: String(row.run_id),
    trigger: String(row.trigger),
    payload: asRecord(row.payload),
  }))
}

export async function markSyncDispatchPublished(input: {
  id: string
  lockToken: string
  messageId: string
}) {
  await getPool().query(
    `UPDATE integrations.sync_dispatch_outbox
     SET status = 'published',
         message_id = $3,
         published_at = now(),
         lock_token = NULL,
         locked_until = NULL,
         last_error = NULL,
         updated_at = now()
     WHERE id = $1 AND lock_token = $2`,
    [input.id, input.lockToken, input.messageId],
  )
}

export async function markSyncDispatchFailed(input: {
  id: string
  lockToken: string
  errorMessage: string
}) {
  await getPool().query(
    `UPDATE integrations.sync_dispatch_outbox
     SET status = CASE WHEN attempts >= 10 THEN 'failed' ELSE 'pending' END,
         next_attempt_at = now() + (LEAST(3600, GREATEST(30, POWER(2, attempts)::int * 30)) || ' seconds')::interval,
         lock_token = NULL,
         locked_until = NULL,
         last_error = $3,
         updated_at = now()
     WHERE id = $1 AND lock_token = $2`,
    [input.id, input.lockToken, input.errorMessage.slice(0, 1000)],
  )
}

export async function failQueuedCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  runId: string
  errorMessage: string
}) {
  await getPool().query(
    `UPDATE integrations.sync_runs
     SET
       status = 'error',
       finished_at = now(),
       error_message = $4,
       metadata = metadata || $5::jsonb
     WHERE id = $1
       AND tenant_id = $2
       AND connection_id = $3
       AND status = 'queued'`,
    [
      input.runId,
      input.tenantId,
      input.connectionId,
      input.errorMessage,
      JSON.stringify({
        dispatchFailedAt: new Date().toISOString(),
      }),
    ],
  )
}

export async function completeScheduledConnectionDispatch(input: {
  tenantId: number
  connectionId: string
  lockToken: string
  nextSyncAt: Date
  messageId: string
  runId: string
}) {
  await getPool().query(
    `UPDATE integrations.connections
     SET
       next_sync_at = $4,
       sync_lock_token = NULL,
       sync_lock_owner = NULL,
       sync_locked_until = NULL,
       metadata = metadata || $5::jsonb,
       updated_at = now()
     WHERE id = $1
       AND tenant_id = $2
       AND sync_lock_token = $3`,
    [
      input.connectionId,
      input.tenantId,
      input.lockToken,
      input.nextSyncAt.toISOString(),
      JSON.stringify({
        lastScheduledDispatchAt: new Date().toISOString(),
        lastScheduledMessageId: input.messageId,
        lastScheduledRunId: input.runId,
      }),
    ],
  )
}

export async function completeScheduledPipelineDispatch(input: {
  tenantId: number
  pipelineId: string
  lockToken: string
  nextSyncAt: Date
  messageId: string
  runId: string
}) {
  await getPool().query(
    `UPDATE integrations.pipelines
     SET
       next_sync_at = $4,
       sync_lock_token = NULL,
       sync_lock_owner = NULL,
       sync_locked_until = NULL,
       metadata = metadata || $5::jsonb,
       updated_at = now()
     WHERE id = $1
       AND tenant_id = $2
       AND sync_lock_token = $3`,
    [
      input.pipelineId,
      input.tenantId,
      input.lockToken,
      input.nextSyncAt.toISOString(),
      JSON.stringify({
        lastScheduledDispatchAt: new Date().toISOString(),
        lastScheduledMessageId: input.messageId,
        lastScheduledRunId: input.runId,
      }),
    ],
  )
}

export async function releaseScheduledConnectionLock(input: {
  tenantId: number
  connectionId: string
  lockToken: string
  errorMessage?: string | null
  runId?: string | null
}) {
  await getPool().query(
    `UPDATE integrations.connections
     SET
       sync_lock_token = NULL,
       sync_lock_owner = NULL,
       sync_locked_until = NULL,
       last_error = COALESCE($4, last_error),
       metadata = metadata || $5::jsonb,
       updated_at = now()
     WHERE id = $1
       AND tenant_id = $2
       AND sync_lock_token = $3`,
    [
      input.connectionId,
      input.tenantId,
      input.lockToken,
      input.errorMessage || null,
      JSON.stringify({
        lastScheduledDispatchError: input.errorMessage || null,
        lastScheduledDispatchErrorAt: input.errorMessage ? new Date().toISOString() : null,
        lastScheduledRunId: input.runId || null,
      }),
    ],
  )

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: 'sync.dispatch_failed',
    severity: 'error',
    actor: 'scheduled-sync',
    message: 'Falha ao publicar sincronizacao agendada no Pub/Sub.',
    metadata: {
      runId: input.runId || null,
      errorMessage: input.errorMessage || null,
    },
  })
}

export async function releaseScheduledPipelineLock(input: {
  tenantId: number
  pipelineId: string
  connectionId: string
  lockToken: string
  errorMessage?: string | null
  runId?: string | null
}) {
  await getPool().query(
    `UPDATE integrations.pipelines
     SET
       sync_lock_token = NULL,
       sync_lock_owner = NULL,
       sync_locked_until = NULL,
       last_error = COALESCE($4, last_error),
       metadata = metadata || $5::jsonb,
       updated_at = now()
     WHERE id = $1
       AND tenant_id = $2
       AND sync_lock_token = $3`,
    [
      input.pipelineId,
      input.tenantId,
      input.lockToken,
      input.errorMessage || null,
      JSON.stringify({
        lastScheduledDispatchError: input.errorMessage || null,
        lastScheduledDispatchErrorAt: input.errorMessage ? new Date().toISOString() : null,
        lastScheduledRunId: input.runId || null,
      }),
    ],
  )

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    eventType: 'sync.dispatch_failed',
    severity: 'error',
    actor: 'scheduled-sync',
    message: 'Falha ao publicar pipeline agendado no Pub/Sub.',
    metadata: {
      pipelineId: input.pipelineId,
      runId: input.runId || null,
      errorMessage: input.errorMessage || null,
    },
  })
}

export async function finishCloudSyncRun(input: {
  tenantId: number
  connectionId: string
  pipelineId?: string | null
  destinationId?: string | null
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
    `UPDATE integrations.sync_runs
     SET
       status = $4,
       finished_at = now(),
       records_in = $5,
       records_updated = $6,
       records_failed = $7,
       error_message = $8,
       metadata = metadata || $9::jsonb
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
    `UPDATE integrations.connections
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
       metadata = metadata || $6::jsonb,
       updated_at = now()
     WHERE id = $1 AND tenant_id = $2`,
    [
      input.connectionId,
      input.tenantId,
      status,
      input.errorMessage || null,
      input.recordsUpdated,
      JSON.stringify({
        dataReadiness: status === 'error' ? 'error' : 'ready',
        dataReadinessError: status === 'error' ? input.errorMessage || 'Sync falhou.' : null,
        dataReadinessUpdatedAt: new Date().toISOString(),
      }),
    ],
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

  if (input.pipelineId) {
    await getPool().query(
      `UPDATE integrations.pipelines
       SET
         last_sync_at = now(),
         last_success_at = CASE WHEN $3 IN ('success', 'warning') THEN now() ELSE last_success_at END,
         last_error = CASE WHEN $3 IN ('success', 'warning') THEN NULL ELSE $4 END,
         records_synced = CASE WHEN $3 IN ('success', 'warning') THEN records_synced + $5 ELSE records_synced END,
         status = CASE
           WHEN $3 IN ('success', 'warning') THEN 'active'
           WHEN $3 = 'error' THEN 'error'
           ELSE status
         END,
         updated_at = now()
       WHERE id = $1 AND tenant_id = $2`,
      [input.pipelineId, input.tenantId, status, input.errorMessage || null, input.recordsUpdated],
    )
  }
}

export async function readIntegrationCursor(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursorKey?: string
}): Promise<Record<string, unknown> | undefined> {
  const result = await getPool().query(
    `SELECT cursor
     FROM integrations.sync_cursors
     WHERE tenant_id = $1 AND connection_id = $2 AND resource = $3 AND cursor_key = $4
     LIMIT 1`,
    [input.tenantId, input.connectionId, input.resource, input.cursorKey || 'default'],
  )
  const row = result.rows[0] as { cursor?: unknown } | undefined
  return row ? asRecord(row.cursor) : undefined
}

export async function writeIntegrationCursor(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursor: Record<string, unknown>
  cursorKey?: string
}) {
  await getPool().query(
    `INSERT INTO integrations.sync_cursors
      (tenant_id, connection_id, resource, cursor_key, cursor_value, cursor, last_synced_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, now(), now())
     ON CONFLICT (tenant_id, connection_id, resource, cursor_key)
     DO UPDATE SET
       cursor_value = EXCLUDED.cursor_value,
       cursor = EXCLUDED.cursor,
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
    `UPDATE integrations.connections
     SET
       secret_ref = $3,
       status = $4,
       metadata = metadata || $5::jsonb,
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
    `INSERT INTO integrations.events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata)
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
    `UPDATE integrations.connections
     SET status = $3, metadata = metadata || $4::jsonb, updated_at = now()
     WHERE id = $1 AND tenant_id = $2`,
    [input.connectionId, input.tenantId, input.status, JSON.stringify(input.metadata || {})],
  )
  return { ok: true, mode: 'postgres' }
}
