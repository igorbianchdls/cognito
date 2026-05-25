export type RawIntegrationRow = {
  tenant_id: number
  connection_id: string
  provider: string
  resource: string
  external_id?: string
  payload: Record<string, unknown>
  ingested_at: string
}
