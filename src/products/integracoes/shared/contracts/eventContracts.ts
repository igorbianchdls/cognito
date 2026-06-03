export type IntegrationEventSeverity = 'info' | 'warning' | 'error'

export type IntegrationEventType =
  | 'connection.created'
  | 'connection.updated'
  | 'connection.oauth.connected'
  | 'connection.reconnect_requested'
  | 'sync.requested'
  | 'sync.resource.started'
  | 'sync.resource.completed'
  | 'sync.resource.failed'
  | 'sync.completed'
  | 'sync.failed'
  | 'auth.callback_received'
  | 'system.note'

export type IntegrationEvent = {
  id: string
  tenantId: number
  connectionId?: string | null
  eventType: IntegrationEventType
  severity: IntegrationEventSeverity
  actor?: string | null
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type CreateIntegrationEventInput = {
  tenantId: number
  connectionId?: string | null
  eventType: IntegrationEventType
  severity?: IntegrationEventSeverity
  actor?: string | null
  message: string
  metadata?: Record<string, unknown>
}
