import type {
  ConnectedCrmAction,
  ConnectedCrmAdapterListInput,
  ConnectedCrmAdapterReadInput,
  ConnectedCrmAdapterResult,
  ConnectedCrmResource,
} from '@/products/mcp-apps/server/domain-adapters/crm/crmTypes'

export type CrmAdapter = {
  provider: string
  supports: (resource: ConnectedCrmResource, action: ConnectedCrmAction) => boolean
  list: (input: ConnectedCrmAdapterListInput) => Promise<ConnectedCrmAdapterResult>
  read: (input: ConnectedCrmAdapterReadInput) => Promise<ConnectedCrmAdapterResult>
}
