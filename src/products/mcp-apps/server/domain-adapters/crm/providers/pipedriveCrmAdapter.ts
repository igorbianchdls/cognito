import { createPendingCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/createPendingCrmAdapter'

export const pipedriveCrmAdapter = createPendingCrmAdapter('pipedrive', [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])
