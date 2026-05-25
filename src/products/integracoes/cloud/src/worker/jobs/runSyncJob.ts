import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

export type RunSyncJobInput = {
  tenantId: number
  connectionId: string
  trigger: IntegrationSyncTrigger
  resources?: string[]
}

export type RunSyncJobOutput = {
  ok: boolean
  mode: 'stub'
  connectionId: string
  message: string
}

export async function runSyncJob(input: RunSyncJobInput): Promise<RunSyncJobOutput> {
  return {
    ok: true,
    mode: 'stub',
    connectionId: input.connectionId,
    message: 'Worker reservado. Nenhum ETL real foi executado.',
  }
}
