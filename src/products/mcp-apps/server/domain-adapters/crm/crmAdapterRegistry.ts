import type { CrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/CrmAdapter'
import { bitrix24CrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/bitrix24CrmAdapter'
import { hubspotCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/hubspotCrmAdapter'
import { pipedriveCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/pipedriveCrmAdapter'
import { rdStationCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/rdStationCrmAdapter'
import { salesforceCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/salesforceCrmAdapter'

const CRM_ADAPTERS = new Map<string, CrmAdapter>(
  [
    bitrix24CrmAdapter,
    hubspotCrmAdapter,
    pipedriveCrmAdapter,
    rdStationCrmAdapter,
    salesforceCrmAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getCrmAdapter(provider: string) {
  return CRM_ADAPTERS.get(provider)
}

export function listCrmAdapterProviders() {
  return [...CRM_ADAPTERS.keys()]
}
