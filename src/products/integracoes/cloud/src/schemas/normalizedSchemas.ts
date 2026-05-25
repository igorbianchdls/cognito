export type NormalizedIntegrationRow = {
  tenant_id: number
  connection_id: string
  provider: string
  resource: string
  record_id: string
  updated_at?: string
  data: Record<string, unknown>
}
