import type {
  ConnectedErpAction,
  ConnectedErpAdapterListInput,
  ConnectedErpAdapterReadInput,
  ConnectedErpAdapterResult,
  ConnectedErpResource,
} from '@/products/plugin/server/domain-adapters/erp/erpTypes'

export type ErpAdapter = {
  provider: string
  supports: (resource: ConnectedErpResource, action: ConnectedErpAction) => boolean
  list: (input: ConnectedErpAdapterListInput) => Promise<ConnectedErpAdapterResult>
  read: (input: ConnectedErpAdapterReadInput) => Promise<ConnectedErpAdapterResult>
}
