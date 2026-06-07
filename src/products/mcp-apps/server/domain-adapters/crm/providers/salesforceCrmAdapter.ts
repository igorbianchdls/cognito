import { createPendingCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/createPendingCrmAdapter'

export const salesforceCrmAdapter = createPendingCrmAdapter('salesforce', [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])
