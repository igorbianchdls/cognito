export type IntegrationPluginPermissions = {
  id: string
  tenantId: number
  connectionId: string
  enabled: boolean
  readResources: string[]
  liveReadResources: string[]
  writeResources: string[]
  destructiveResources: string[]
  requireConfirmation: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type UpsertIntegrationPluginPermissionsInput = {
  tenantId: number
  connectionId: string
  enabled?: boolean
  readResources?: string[]
  liveReadResources?: string[]
  writeResources?: string[]
  destructiveResources?: string[]
  requireConfirmation?: boolean
  metadata?: Record<string, unknown>
}
