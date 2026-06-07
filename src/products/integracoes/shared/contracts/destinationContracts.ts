export type IntegrationDestinationType =
  | 'bigquery'
  | 'google_sheets'
  | 'excel'
  | 'postgres'
  | 'supabase'
  | 'snowflake'
  | 's3'

export type IntegrationDestinationStatus = 'active' | 'disabled' | 'error'

export type IntegrationDestination = {
  id: string
  tenantId: number
  type: IntegrationDestinationType
  name: string
  status: IntegrationDestinationStatus
  config: Record<string, unknown>
  secretRef?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateIntegrationDestinationInput = {
  tenantId: number
  type: IntegrationDestinationType
  name: string
  status?: IntegrationDestinationStatus
  config?: Record<string, unknown>
  secretRef?: string | null
  metadata?: Record<string, unknown>
}

export type UpdateIntegrationDestinationInput = {
  name?: string
  status?: IntegrationDestinationStatus
  config?: Record<string, unknown>
  secretRef?: string | null
  metadata?: Record<string, unknown>
}
