export type IntegrationPluginActionAuditStatus = 'preview' | 'executed' | 'blocked' | 'error'
export type IntegrationPluginActionAuditDomain = 'erp' | 'crm' | 'ecommerce'

export type IntegrationPluginActionAudit = {
  id: string
  tenantId: number
  connectionId?: string | null
  domain: IntegrationPluginActionAuditDomain
  provider?: string | null
  tool: string
  resource: string
  action: string
  dryRun: boolean
  permissionKind?: 'write' | 'destructive' | null
  status: IntegrationPluginActionAuditStatus
  success: boolean
  message: string
  targetId?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  actor?: string | null
  createdAt: string
}

export type CreateIntegrationPluginActionAuditInput = {
  tenantId: number
  connectionId?: string | null
  domain: IntegrationPluginActionAuditDomain
  provider?: string | null
  tool: string
  resource: string
  action: string
  dryRun: boolean
  permissionKind?: 'write' | 'destructive' | null
  status: IntegrationPluginActionAuditStatus
  success: boolean
  message: string
  targetId?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  actor?: string | null
}
