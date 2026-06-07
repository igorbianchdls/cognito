export type IntegrationMcpPermissions = {
  id: string
  tenantId: number
  connectionId: string
  enabled: boolean
  readResources: string[]
  writeResources: string[]
  destructiveResources: string[]
  requireConfirmation: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type UpsertIntegrationMcpPermissionsInput = {
  tenantId: number
  connectionId: string
  enabled?: boolean
  readResources?: string[]
  writeResources?: string[]
  destructiveResources?: string[]
  requireConfirmation?: boolean
  metadata?: Record<string, unknown>
}
