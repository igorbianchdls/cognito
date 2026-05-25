export type IntegrationSyncTrigger = 'manual' | 'scheduled' | 'webhook' | 'initial'

export type IntegrationSyncRunStatus = 'queued' | 'running' | 'success' | 'warning' | 'error' | 'cancelled'

export type IntegrationSyncRun = {
  id: string
  tenantId: number
  connectionId: string
  trigger: IntegrationSyncTrigger
  status: IntegrationSyncRunStatus
  startedAt?: string | null
  finishedAt?: string | null
  resource?: string | null
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
}

export type TriggerIntegrationSyncInput = {
  connectionId: string
  tenantId: number
  trigger: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

export type IntegrationSyncResult = {
  connectionId: string
  runId: string
  status: IntegrationSyncRunStatus
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string | null
}
