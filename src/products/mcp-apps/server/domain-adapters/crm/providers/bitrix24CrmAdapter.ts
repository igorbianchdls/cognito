import { createPendingCrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/providers/createPendingCrmAdapter'

export const bitrix24CrmAdapter = createPendingCrmAdapter('bitrix24', [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])
