import {
  createBigQueryErpAdapter,
  makeErpConfigs,
} from '@/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter'

const OLIST_ERP_RESOURCE_MAP = {
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  vendedores: 'vendedores',
  produtos: 'produtos',
  variacoes: 'variacoes',
  marcas: 'marcas',
  'pedidos-venda': 'pedidos_venda',
  'itens-venda': 'itens_venda',
  'parcelas-venda': 'parcelas_venda',
  'pedidos-compra': 'compras',
  'contas-a-receber': 'contas_receber',
  'contas-a-pagar': 'contas_pagar',
  'notas-fiscais': 'notas_fiscais',
  'notas-consumidor': 'notas_consumidor',
  expedicoes: 'expedicoes',
  separacoes: 'separacoes',
  'estoque-atual': 'estoque',
  'movimentacoes-estoque': 'estoque_movimentacoes',
  'listas-preco': 'listas_preco',
  'formas-envio': 'formas_envio',
  'formas-pagamento': 'formas_pagamento',
  intermediadores: 'intermediadores',
  categorias: 'categorias',
  'empresa-conectada': 'empresa_conectada',
  'uso-api': 'uso_api',
  gatilhos: 'gatilhos',
} as const

export const olistErpAdapter = createBigQueryErpAdapter('olist_erp', makeErpConfigs(OLIST_ERP_RESOURCE_MAP))
export const tinyErpAdapter = createBigQueryErpAdapter('tiny', makeErpConfigs(OLIST_ERP_RESOURCE_MAP))
