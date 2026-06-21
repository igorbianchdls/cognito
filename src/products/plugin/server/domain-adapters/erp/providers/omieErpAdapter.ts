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
  'pedidos-compra': 'pedidos_compra',
  'notas-fiscais': 'notas_fiscais',
  'notas-fiscais-servico': 'notas_servico',
  'centros-custo': 'departamentos',
  categorias: 'categorias',
  produtos: 'produtos',
  servicos: 'servicos',
  contratos: 'contratos',
  'estoque-atual': 'estoque_saldos',
  'movimentacoes-estoque': 'estoque_movimentacoes',
  'lancamentos-financeiros': 'lancamentos_financeiros',
  'contas-correntes': 'contas_correntes',
}))
