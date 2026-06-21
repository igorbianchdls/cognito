import type { ErpAdapter } from '@/products/plugin/server/domain-adapters/erp/ErpAdapter'
import { blingErpAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/blingErpAdapter'
import { contaAzulErpAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/contaAzulErpAdapter'
import { olistErpAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/olistErpAdapter'
import { omieErpAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/omieErpAdapter'

const ERP_ADAPTERS = new Map<string, ErpAdapter>(
  [omieErpAdapter, contaAzulErpAdapter, blingErpAdapter, olistErpAdapter].map((adapter) => [adapter.provider, adapter] as const),
)

export function getErpAdapter(provider: string) {
  return ERP_ADAPTERS.get(provider)
}

export function listErpAdapterProviders() {
  return [...ERP_ADAPTERS.keys()]
}
