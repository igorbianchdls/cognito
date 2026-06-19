import {
  createBigQueryErpAdapter,
  makeErpConfigs,
} from '@/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter'

export const omieErpAdapter = createBigQueryErpAdapter('omie', makeErpConfigs({
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'pedidos-venda': 'pedidos_venda',
  'centros-custo': 'departamentos',
  produtos: 'produtos',
  servicos: 'servicos',
  contratos: 'contratos',
  'estoque-atual': 'estoque_saldos',
}))
