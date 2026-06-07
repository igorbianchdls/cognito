import { createServer, type IncomingMessage } from 'node:http'

import { runSyncJob } from '@/products/integracoes/cloud/src/worker/jobs/runSyncJob'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

const syncTriggers: IntegrationSyncTrigger[] = ['manual', 'scheduled', 'webhook', 'initial']

type WorkerPayload = {
  tenantId?: number
  connectionId?: string
  pipelineId?: string
  destinationId?: string
  runId?: string
  trigger?: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

type PubSubPushBody = {
  message?: {
    data?: string
  }
}

function parsePayloadFromEnv(): WorkerPayload {
  const rawPayload = process.env.SYNC_JOB_PAYLOAD?.trim()
  if (!rawPayload) return {}

  const payload = JSON.parse(rawPayload) as WorkerPayload
  return payload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizePayload(value: unknown): WorkerPayload {
  if (!isRecord(value)) return {}

  return {
    tenantId: typeof value.tenantId === 'number' ? value.tenantId : undefined,
    connectionId: typeof value.connectionId === 'string' ? value.connectionId : undefined,
    pipelineId: typeof value.pipelineId === 'string' ? value.pipelineId : undefined,
    destinationId: typeof value.destinationId === 'string' ? value.destinationId : undefined,
    runId: typeof value.runId === 'string' ? value.runId : undefined,
    trigger: typeof value.trigger === 'string' && syncTriggers.includes(value.trigger as IntegrationSyncTrigger)
      ? value.trigger as IntegrationSyncTrigger
      : undefined,
    resources: Array.isArray(value.resources)
      ? value.resources.filter((resource): resource is string => typeof resource === 'string')
      : undefined,
    requestedBy: typeof value.requestedBy === 'string' ? value.requestedBy : undefined,
  }
}

function parsePubSubPushBody(body: unknown): WorkerPayload {
  if (!isRecord(body)) return {}

  const pubSubBody = body as PubSubPushBody
  const encodedData = pubSubBody.message?.data
  if (!encodedData) return normalizePayload(body)

  const decoded = Buffer.from(encodedData, 'base64').toString('utf8').trim()
  if (!decoded) return {}

  return normalizePayload(JSON.parse(decoded) as unknown)
}

function readRequestBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8').trim()
      if (!rawBody) {
        resolve(undefined)
        return
      }

      try {
        resolve(JSON.parse(rawBody) as unknown)
      } catch {
        resolve(rawBody)
      }
    })
    request.on('error', () => resolve(undefined))
  })
}

function parseTrigger(value: string | undefined): IntegrationSyncTrigger {
  if (value && syncTriggers.includes(value as IntegrationSyncTrigger)) {
    return value as IntegrationSyncTrigger
  }

  return 'manual'
}

async function executeWorker(payload: WorkerPayload) {
  const result = await runSyncJob({
    tenantId: payload.tenantId || Number(process.env.SYNC_TENANT_ID || 1),
    connectionId: payload.connectionId || process.env.SYNC_CONNECTION_ID || 'stub',
    pipelineId: payload.pipelineId || process.env.SYNC_PIPELINE_ID,
    destinationId: payload.destinationId || process.env.SYNC_DESTINATION_ID,
    runId: payload.runId || process.env.SYNC_RUN_ID,
    trigger: payload.trigger || parseTrigger(process.env.SYNC_TRIGGER),
    resources: payload.resources,
    requestedBy: payload.requestedBy,
  })

  console.log(JSON.stringify({
    severity: 'INFO',
    message: 'Integration worker finished.',
    result,
  }))

  return result
}

export async function main() {
  return executeWorker(parsePayloadFromEnv())
}

export function startHttpServer() {
  const port = Number(process.env.PORT || 8080)
  const httpServer = createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
    if (request.method === 'GET' && url.pathname === '/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ ok: true, service: 'integracoes-worker', mode: 'gcp_worker' }))
      return
    }

    if (request.method !== 'POST' || url.pathname !== '/pubsub') {
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ ok: false, error: 'Rota worker nao encontrada.' }))
      return
    }

    try {
      const result = await executeWorker(parsePubSubPushBody(await readRequestBody(request)))
      response.writeHead(204)
      response.end()
      void result
    } catch (error) {
      console.error(JSON.stringify({
        severity: 'ERROR',
        message: 'Integration worker HTTP request failed.',
        error: error instanceof Error ? error.message : String(error),
      }))
      response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ ok: false, error: 'Falha ao processar mensagem Pub/Sub.' }))
    }
  })

  httpServer.listen(port, '0.0.0.0')
  return httpServer
}

if (process.env.WORKER_HTTP_SERVER === 'true' || process.env.PORT) {
  startHttpServer()
} else {
  void main().catch((error: unknown) => {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: 'Integration worker failed.',
      error: error instanceof Error ? error.message : String(error),
    }))
    process.exit(1)
  })
}
