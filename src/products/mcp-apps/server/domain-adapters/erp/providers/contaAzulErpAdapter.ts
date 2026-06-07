import {
  createPostgresErpAdapter,
  makeErpConfigs,
} from '@/products/mcp-apps/server/domain-adapters/erp/providers/createPostgresErpAdapter'

export const contaAzulErpAdapter = createPostgresErpAdapter('conta_azul', makeErpConfigs({
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'pedidos-venda': 'vendas',
  produtos: 'produtos',
  'estoque-atual': 'estoque',
}))
