import {
  createPostgresErpAdapter,
  makeErpConfigs,
} from '@/products/mcp-apps/server/domain-adapters/erp/providers/createPostgresErpAdapter'

export const blingErpAdapter = createPostgresErpAdapter('bling', makeErpConfigs({
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'pedidos-venda': 'pedidos_venda',
  produtos: 'produtos',
  'estoque-atual': 'estoque',
}))
