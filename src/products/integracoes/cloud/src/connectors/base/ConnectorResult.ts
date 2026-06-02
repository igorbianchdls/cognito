export type ConnectorResultStatus = 'success' | 'warning' | 'error'

export type ConnectorResult = {
  status: ConnectorResultStatus
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  rows?: Record<string, unknown>[]
  nextCursor?: Record<string, unknown>
  errorMessage?: string
  metadata?: Record<string, unknown>
}
