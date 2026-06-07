import { createPendingErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/providers/createPendingErpAdapter'

export const omieErpAdapter = createPendingErpAdapter('omie', [
  'clientes',
  'fornecedores',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'produtos',
  'estoque-atual',
])
