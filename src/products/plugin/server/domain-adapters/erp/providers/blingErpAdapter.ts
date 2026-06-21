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
  'pedidos-compra': 'compras',
  'notas-fiscais': 'notas_fiscais',
  'notas-fiscais-servico': 'notas_servico',
  'notas-consumidor': 'notas_consumidor',
  produtos: 'produtos',
  servicos: 'servicos',
  'estoque-atual': 'estoque',
  categorias: 'categorias',
  'formas-pagamento': 'formas_pagamento',
  vendedores: 'vendedores',
  transportadoras: 'transportadoras',
  'canais-venda': 'canais_venda',
  lojas: 'lojas',
  depositos: 'depositos',
}))
