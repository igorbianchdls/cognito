import { createPendingCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/createPendingCrmAdapter'

export const rdStationCrmAdapter = createPendingCrmAdapter('rd_station_crm', [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])
