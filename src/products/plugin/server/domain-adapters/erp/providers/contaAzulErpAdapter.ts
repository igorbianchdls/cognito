import {
  createBigQueryErpAdapter,
  makeErpConfigs,
} from '@/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter'

export const contaAzulErpAdapter = createBigQueryErpAdapter('conta_azul', makeErpConfigs({
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'pedidos-venda': 'vendas',
  'centros-custo': 'centros_custo',
  produtos: 'produtos',
  servicos: 'servicos',
  contratos: 'contratos',
  'estoque-atual': 'estoque',
}))
