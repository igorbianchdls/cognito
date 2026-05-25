export type ConnectorContext = {
  tenantId: number
  connectionId: string
  provider: string
  secretRef?: string | null
  selectedResources: string[]
  cursor?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
