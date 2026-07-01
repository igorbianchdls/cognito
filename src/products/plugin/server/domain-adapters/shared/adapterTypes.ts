import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'

export type ConnectedDomainAction = 'listar' | 'ler' | 'listar_live' | 'ler_live'

export type ConnectedDomainProviderStatus = {
  provider: string
  connection_id?: string
  display_name?: string
  ok: boolean
  error?: string
}

export type ConnectedDomainRecord = {
  id: string
  provider: string
  provider_id: string
  resource: string
  fields: Record<string, unknown>
  provider_fields?: Record<string, unknown>
  coverage?: Record<string, boolean>
}

export type ConnectedDomainAdapterInput<Resource extends string> = {
  tenantId: number
  connection: IntegrationConnection
  resource: Resource
  filters: Record<string, unknown>
  limit: number
  includeProviderFields: boolean
}

export type ConnectedDomainAdapterReadInput<Resource extends string> =
  ConnectedDomainAdapterInput<Resource> & {
    id: string
  }

export type ConnectedDomainAdapterResult = {
  rows: ConnectedDomainRecord[]
  columns: string[]
  count: number
  warnings?: string[]
  freshness?: ConnectedDomainFreshness[]
}

export type ConnectedDomainFreshness = {
  provider: string
  resource: string
  dataset: string
  table: string
  last_synced_at?: string | null
  last_normalized_at?: string | null
  source_run_id?: string | null
  source_run_ids?: string[]
}

export type ConnectedDomainToolResult = {
  success: boolean
  tool: string
  action: ConnectedDomainAction
  resource: string
  title: string
  rows: ConnectedDomainRecord[]
  columns: string[]
  count: number
  providers: ConnectedDomainProviderStatus[]
  errors?: string[]
  warnings?: string[]
  freshness?: ConnectedDomainFreshness[]
}
