export type ConnectorContext = {
  tenantId: number
  connectionId: string
  provider: string
  secretRef?: string | null
  credentials?: Record<string, unknown> | string | null
  selectedResources: string[]
  cursor?: ConnectorCursor
  metadata?: Record<string, unknown>
}

export type ConnectorCursor = {
  updatedAt?: string
  updated_at?: string
  next?: string | number | null
  page?: number
  offset?: number
  [key: string]: unknown
}
