import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'

export type ConnectedProviderActionInput<Resource extends string, Action extends string> = {
  tenantId: number
  connection: IntegrationConnection
  resource: Resource
  action: Action
  id?: string | null
  payload: Record<string, unknown>
  idempotencyKey?: string | null
  dryRun: boolean
}

export type ConnectedProviderActionResult = {
  ok: boolean
  message: string
  id?: string | null
  status?: string | null
  previousStatus?: string | null
  nextStatus?: string | null
  metadata?: Record<string, unknown>
}

export type ConnectedProviderApiAdapter<Resource extends string, Action extends string> = {
  provider: string
  supportsLiveRead: (resource: Resource) => boolean
  supportsAction: (resource: Resource, action: Action) => boolean
  listLive: (input: ConnectedDomainAdapterInput<Resource>) => Promise<ConnectedDomainAdapterResult>
  readLive: (input: ConnectedDomainAdapterReadInput<Resource>) => Promise<ConnectedDomainAdapterResult>
  executeAction: (input: ConnectedProviderActionInput<Resource, Action>) => Promise<ConnectedProviderActionResult>
}
