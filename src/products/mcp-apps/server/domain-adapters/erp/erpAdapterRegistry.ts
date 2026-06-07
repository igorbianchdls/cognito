import type { ErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/ErpAdapter'
import { blingErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/providers/blingErpAdapter'
import { contaAzulErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/providers/contaAzulErpAdapter'
import { omieErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/providers/omieErpAdapter'

const ERP_ADAPTERS = new Map<string, ErpAdapter>(
  [omieErpAdapter, contaAzulErpAdapter, blingErpAdapter].map((adapter) => [adapter.provider, adapter] as const),
)

export function getErpAdapter(provider: string) {
  return ERP_ADAPTERS.get(provider)
}

export function listErpAdapterProviders() {
  return [...ERP_ADAPTERS.keys()]
}
