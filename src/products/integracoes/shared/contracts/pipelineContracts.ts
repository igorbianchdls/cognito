export type IntegrationPipelineStatus = 'draft' | 'active' | 'paused' | 'error' | 'disabled'

export type IntegrationPipeline = {
  id: string
  tenantId: number
  sourceConnectionId: string
  destinationId: string
  name: string
  status: IntegrationPipelineStatus
  selectedResources: string[]
  syncFrequency: string
  syncEnabled: boolean
  nextSyncAt?: string | null
  syncLockedUntil?: string | null
  syncLockToken?: string | null
  syncLockOwner?: string | null
  lastSyncAt?: string | null
  lastSuccessAt?: string | null
  lastError?: string | null
  recordsSynced: number
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateIntegrationPipelineInput = {
  tenantId: number
  sourceConnectionId: string
  destinationId: string
  name?: string
  status?: IntegrationPipelineStatus
  selectedResources?: string[]
  syncFrequency?: string
  syncEnabled?: boolean
  nextSyncAt?: string | null
  metadata?: Record<string, unknown>
}

export type UpdateIntegrationPipelineInput = {
  name?: string
  status?: IntegrationPipelineStatus
  selectedResources?: string[]
  syncFrequency?: string
  syncEnabled?: boolean
  nextSyncAt?: string | null
  metadata?: Record<string, unknown>
}
