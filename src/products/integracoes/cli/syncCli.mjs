import { Client } from 'pg'

import {
  getOptionalId,
  getOptionalPositiveInt,
  getOptionalStringArray,
  getRequiredPositiveInt,
  hasFlag,
  parseCliArgs,
} from './shared/args.mjs'
import { loadIntegrationCliEnv } from './shared/env.mjs'
import { formatRun, printInfo } from './shared/output.mjs'

const READY_CONNECTION_STATUSES = new Set(['connected', 'syncing', 'warning'])
const TERMINAL_RUN_STATUSES = new Set(['success', 'warning', 'error', 'cancelled'])

function usage() {
  return [
    'Uso:',
    '  node scripts/integracoes/sync.mjs --tenant <id> --connection <id> [opcoes]',
    '',
    'Opcoes:',
    '  --pipeline <id>       Pipeline especifica para o sync.',
    '  --destination <id>    Destination BigQuery especifica.',
    '  --resources a,b,c     Resources para sincronizar. Usa os resources da conexao se omitido.',
    '  --control-url <url>   URL do Control API. Alternativa a INTEGRATIONS_CONTROL_API_URL.',
    '  --wait                Aguarda ate a run terminar.',
    '  --timeout <seconds>   Timeout do --wait. Default: 300.',
    '  --poll <seconds>      Intervalo do polling. Default: 5.',
  ].join('\n')
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} ausente.`)
  return value
}

function resolveControlApiUrl(explicitUrl) {
  const value = explicitUrl || process.env.INTEGRATIONS_CONTROL_API_URL?.trim()
  if (!value) throw new Error('INTEGRATIONS_CONTROL_API_URL ausente. Configure a env ou use --control-url <url>.')
  return value.replace(/\/+$/, '')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function asJsonArray(value) {
  return Array.isArray(value) ? value : []
}

async function fetchConnection(client, tenantId, connectionId) {
  const result = await client.query(
    `SELECT id, tenant_id, domain, provider, display_name, status, selected_resources
     FROM integrations.connections
     WHERE tenant_id = $1 AND id = $2
     LIMIT 1`,
    [tenantId, connectionId],
  )
  return result.rows[0] || null
}

async function assertPipeline(client, tenantId, connectionId, pipelineId) {
  if (!pipelineId) return
  const result = await client.query(
    `SELECT id, source_connection_id, destination_id, status
     FROM integrations.pipelines
     WHERE tenant_id = $1 AND id = $2
     LIMIT 1`,
    [tenantId, pipelineId],
  )
  const pipeline = result.rows[0]
  if (!pipeline) throw new Error(`Pipeline ${pipelineId} nao encontrada para tenant ${tenantId}.`)
  if (String(pipeline.source_connection_id) !== String(connectionId)) {
    throw new Error(`Pipeline ${pipelineId} pertence a conexao ${pipeline.source_connection_id}, nao a ${connectionId}.`)
  }
  if (pipeline.status !== 'active') {
    throw new Error(`Pipeline ${pipelineId} esta com status ${pipeline.status}.`)
  }
}

async function assertDestination(client, tenantId, destinationId) {
  if (!destinationId) return
  const result = await client.query(
    `SELECT id, type, status
     FROM integrations.destinations
     WHERE tenant_id = $1 AND id = $2
     LIMIT 1`,
    [tenantId, destinationId],
  )
  const destination = result.rows[0]
  if (!destination) throw new Error(`Destination ${destinationId} nao encontrada para tenant ${tenantId}.`)
  if (destination.type !== 'bigquery') throw new Error(`Destination ${destinationId} nao e BigQuery.`)
  if (destination.status !== 'active') throw new Error(`Destination ${destinationId} esta com status ${destination.status}.`)
}

async function insertSyncRequestedEvent(client, input) {
  await client.query(
    `INSERT INTO integrations.events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata)
     VALUES
      ($1, $2, 'sync.requested', 'info', $3, 'Sincronizacao solicitada pela CLI.', $4::jsonb)`,
    [
      input.tenantId,
      input.connectionId,
      input.requestedBy,
      JSON.stringify({
        trigger: 'manual',
        resources: input.resources,
        setupMode: 'cloud',
        cli: true,
      }),
    ],
  )
}

async function createQueuedRun(client, input) {
  await client.query('BEGIN')
  try {
    await insertSyncRequestedEvent(client, input)
    const result = await client.query(
      `INSERT INTO integrations.sync_runs
        (tenant_id, connection_id, pipeline_id, destination_id, trigger, status, started_at, finished_at, records_in, records_updated, records_failed, metadata)
       VALUES
        ($1, $2, $3, $4, 'manual', 'queued', NULL, NULL, 0, 0, 0, $5::jsonb)
       RETURNING *`,
      [
        input.tenantId,
        input.connectionId,
        input.pipelineId || null,
        input.destinationId || null,
        JSON.stringify({
          simulated: false,
          resources: input.resources,
          requestedBy: input.requestedBy,
          setupMode: 'cloud',
          cli: true,
        }),
      ],
    )
    await client.query(
      `UPDATE integrations.connections
       SET last_sync_at = now(), updated_at = now()
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, input.connectionId],
    )
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }
}

async function markRunError(client, input) {
  await client.query(
    `UPDATE integrations.sync_runs
     SET status = 'error',
         finished_at = now(),
         error_message = $4,
         metadata = metadata || $5::jsonb
     WHERE tenant_id = $1 AND connection_id = $2 AND id = $3`,
    [
      input.tenantId,
      input.connectionId,
      input.runId,
      input.errorMessage,
      JSON.stringify({
        dispatchFailedAt: new Date().toISOString(),
      }),
    ],
  )
}

async function fetchRun(client, tenantId, connectionId, runId) {
  const result = await client.query(
    `SELECT *
     FROM integrations.sync_runs
     WHERE tenant_id = $1 AND connection_id = $2 AND id = $3
     LIMIT 1`,
    [tenantId, connectionId, runId],
  )
  return result.rows[0] || null
}

async function dispatchSync(input) {
  const response = await fetch(`${input.controlUrl}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.INTEGRATIONS_INTERNAL_API_KEY
        ? { Authorization: `Bearer ${process.env.INTEGRATIONS_INTERNAL_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      pipelineId: input.pipelineId,
      destinationId: input.destinationId,
      runId: input.runId,
      trigger: 'manual',
      resources: input.resources,
      requestedBy: input.requestedBy,
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Falha ao chamar Control API /sync: ${response.status}`)
  }
  return payload
}

async function waitForRun(client, input) {
  const startedAt = Date.now()
  const timeoutMs = input.timeoutSeconds * 1000
  const pollMs = input.pollSeconds * 1000
  let lastStatus = null

  while (Date.now() - startedAt <= timeoutMs) {
    const run = await fetchRun(client, input.tenantId, input.connectionId, input.runId)
    if (!run) throw new Error(`Run ${input.runId} nao encontrada durante polling.`)
    if (run.status !== lastStatus) {
      printInfo('Status da run:', formatRun(run))
      lastStatus = run.status
    }
    if (TERMINAL_RUN_STATUSES.has(run.status)) return run
    await sleep(pollMs)
  }

  throw new Error(`Timeout aguardando run ${input.runId} por ${input.timeoutSeconds}s.`)
}

export async function runSyncCli(argv = process.argv.slice(2)) {
  const args = parseCliArgs(argv)
  if (hasFlag(args, '--help')) {
    console.log(usage())
    return 0
  }

  loadIntegrationCliEnv()

  const tenantId = getRequiredPositiveInt(args, '--tenant')
  const connectionId = String(getRequiredPositiveInt(args, '--connection'))
  const pipelineId = getOptionalId(args, '--pipeline')
  const destinationId = getOptionalId(args, '--destination')
  const resources = getOptionalStringArray(args, '--resources')
  const controlUrl = resolveControlApiUrl(args.values.get('--control-url'))
  const wait = hasFlag(args, '--wait')
  const timeoutSeconds = getOptionalPositiveInt(args, '--timeout', 300)
  const pollSeconds = getOptionalPositiveInt(args, '--poll', 5)

  const dbUrl = requireEnv('SUPABASE_DB_URL')

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  try {
    const connection = await fetchConnection(client, tenantId, connectionId)
    if (!connection) throw new Error(`Conexao ${connectionId} nao encontrada para tenant ${tenantId}.`)
    if (!READY_CONNECTION_STATUSES.has(connection.status)) {
      throw new Error(`Conexao ${connectionId} esta com status ${connection.status}. Reautorize antes de sincronizar.`)
    }

    await assertPipeline(client, tenantId, connectionId, pipelineId)
    await assertDestination(client, tenantId, destinationId)

    const selectedResources = resources || asJsonArray(connection.selected_resources).map(String).filter(Boolean)
    if (!selectedResources.length) {
      throw new Error(`Conexao ${connectionId} nao possui resources selecionados. Informe --resources.`)
    }

    const run = await createQueuedRun(client, {
      tenantId,
      connectionId,
      pipelineId,
      destinationId,
      resources: selectedResources,
      requestedBy: 'cli',
    })
    printInfo('Run criada:', formatRun(run))

    try {
      const dispatch = await dispatchSync({
        tenantId,
        connectionId,
        pipelineId,
        destinationId,
        runId: String(run.id),
        resources: selectedResources,
        requestedBy: 'cli',
        controlUrl,
      })
      printInfo('Sync publicado:', {
        runId: String(run.id),
        messageId: dispatch.messageId || null,
        mode: dispatch.mode || null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await markRunError(client, {
        tenantId,
        connectionId,
        runId: String(run.id),
        errorMessage: message,
      })
      throw error
    }

    if (!wait) return 0

    const finalRun = await waitForRun(client, {
      tenantId,
      connectionId,
      runId: String(run.id),
      timeoutSeconds,
      pollSeconds,
    })
    printInfo('Run final:', formatRun(finalRun))
    return finalRun.status === 'success' || finalRun.status === 'warning' ? 0 : 1
  } finally {
    await client.end().catch(() => {})
  }
}
