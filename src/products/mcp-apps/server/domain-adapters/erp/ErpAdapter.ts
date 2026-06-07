import type {
  ConnectedErpAction,
  ConnectedErpAdapterListInput,
  ConnectedErpAdapterReadInput,
  ConnectedErpAdapterResult,
  ConnectedErpResource,
} from '@/products/mcp-apps/server/domain-adapters/erp/erpTypes'

export type ErpAdapter = {
  provider: string
  supports: (resource: ConnectedErpResource, action: ConnectedErpAction) => boolean
  list: (input: ConnectedErpAdapterListInput) => Promise<ConnectedErpAdapterResult>
  read: (input: ConnectedErpAdapterReadInput) => Promise<ConnectedErpAdapterResult>
}
