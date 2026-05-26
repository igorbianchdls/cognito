import { runSyncJob } from '@/products/integracoes/cloud/src/worker/jobs/runSyncJob'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

const syncTriggers: IntegrationSyncTrigger[] = ['manual', 'scheduled', 'webhook', 'initial']

type WorkerPayload = {
  tenantId?: number
  connectionId?: string
  trigger?: IntegrationSyncTrigger
  resources?: string[]
}

function parsePayload(): WorkerPayload {
  const rawPayload = process.env.SYNC_JOB_PAYLOAD?.trim()
  if (!rawPayload) return {}

  const payload = JSON.parse(rawPayload) as WorkerPayload
  return payload
}

function parseTrigger(value: string | undefined): IntegrationSyncTrigger {
  if (value && syncTriggers.includes(value as IntegrationSyncTrigger)) {
    return value as IntegrationSyncTrigger
  }

  return 'manual'
}

export async function main() {
  const payload = parsePayload()
  const result = await runSyncJob({
    tenantId: payload.tenantId || Number(process.env.SYNC_TENANT_ID || 1),
    connectionId: payload.connectionId || process.env.SYNC_CONNECTION_ID || 'stub',
    trigger: payload.trigger || parseTrigger(process.env.SYNC_TRIGGER),
    resources: payload.resources,
  })

  console.log(JSON.stringify({
    severity: 'INFO',
    message: 'Integration worker finished.',
    result,
  }))

  return result
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({
    severity: 'ERROR',
    message: 'Integration worker failed.',
    error: error instanceof Error ? error.message : String(error),
  }))
  process.exit(1)
})
