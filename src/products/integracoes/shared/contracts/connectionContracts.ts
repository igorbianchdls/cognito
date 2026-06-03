import type { IntegrationDomain, IntegrationSyncMode } from '@/products/integracoes/shared/providers/providerTypes'

export type IntegrationConnectionStatus =
  | 'draft'
  | 'pending_auth'
  | 'connected'
  | 'syncing'
  | 'warning'
  | 'error'
  | 'disabled'

export type IntegrationConnection = {
  id: string
  tenantId: number
  domain: IntegrationDomain
  provider: string
  status: IntegrationConnectionStatus
  displayName: string
  externalAccountId?: string | null
  secretRef?: string | null
  selectedResources: string[]
  syncFrequency: string
  syncModes: IntegrationSyncMode[]
  lastSyncAt?: string | null
  lastSuccessAt?: string | null
  lastError?: string | null
  recordsSynced: number
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateIntegrationConnectionInput = {
  tenantId: number
  provider: string
  displayName?: string
  selectedResources?: string[]
  syncFrequency?: string
  syncModes?: IntegrationSyncMode[]
  credentials?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type UpdateIntegrationConnectionInput = {
  displayName?: string
  status?: IntegrationConnectionStatus
  selectedResources?: string[]
  syncFrequency?: string
  syncModes?: IntegrationSyncMode[]
  metadata?: Record<string, unknown>
}
