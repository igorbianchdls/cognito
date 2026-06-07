import { createPendingCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/createPendingCrmAdapter'

export const hubspotCrmAdapter = createPendingCrmAdapter('hubspot', [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])
