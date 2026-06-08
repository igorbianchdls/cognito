export type IntegrationMcpActionAuditStatus = 'preview' | 'executed' | 'blocked' | 'error'

export type IntegrationMcpActionAudit = {
  id: string
  tenantId: number
  connectionId?: string | null
  domain: 'erp' | 'crm'
  provider?: string | null
  tool: string
  resource: string
  action: string
  dryRun: boolean
  permissionKind?: 'write' | 'destructive' | null
  status: IntegrationMcpActionAuditStatus
  success: boolean
  message: string
  targetId?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  actor?: string | null
  createdAt: string
}

export type CreateIntegrationMcpActionAuditInput = {
  tenantId: number
  connectionId?: string | null
  domain: 'erp' | 'crm'
  provider?: string | null
  tool: string
  resource: string
  action: string
  dryRun: boolean
  permissionKind?: 'write' | 'destructive' | null
  status: IntegrationMcpActionAuditStatus
  success: boolean
  message: string
  targetId?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  actor?: string | null
}
