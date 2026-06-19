import {
  createBigQueryErpAdapter,
  makeErpConfigs,
} from '@/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter'

export const blingErpAdapter = createBigQueryErpAdapter('bling', makeErpConfigs({
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'pedidos-venda': 'pedidos_venda',
  produtos: 'produtos',
  servicos: 'servicos',
  'estoque-atual': 'estoque',
}))
