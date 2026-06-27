import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'

export const CONNECTED_ERP_RESOURCES = [
  'clientes',
  'fornecedores',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'venda-detalhes',
  'venda-proximo-numero',
  'pedidos-compra',
  'itens-venda',
  'parcelas-venda',
  'notas-fiscais',
  'notas-fiscais-servico',
  'notas-consumidor',
  'expedicoes',
  'separacoes',
  'movimentacoes-estoque',
  'vendedores',
  'variacoes',
  'marcas',
  'listas-preco',
  'formas-envio',
  'formas-pagamento',
  'intermediadores',
  'transportadoras',
  'canais-venda',
  'lojas',
  'depositos',
  'categorias',
  'categorias-dre',
  'empresa-conectada',
  'uso-api',
  'gatilhos',
  'centros-custo',
  'contas-financeiras',
  'saldos-contas-financeiras',
  'transferencias',
  'eventos-financeiros-alteracoes',
  'saldos-iniciais',
  'contrato-proximo-numero',
  'lancamentos-financeiros',
  'contas-correntes',
  'produto-categorias',
  'produto-cest',
  'produto-ecommerce-marcas',
  'produto-ncm',
  'produto-unidades-medida',
  'produtos',
  'servicos',
  'contratos',
  'estoque-atual',
] as const

export type ConnectedErpResource = (typeof CONNECTED_ERP_RESOURCES)[number]
export type ConnectedErpAction = ConnectedDomainAction
export type ConnectedErpProviderAction =
  | 'criar'
  | 'atualizar'
  | 'baixar'
  | 'cancelar'
  | 'deletar'
  | 'estornar'
  | 'reabrir'
  | 'alterar_status'

export type ConnectedErpToolInput = {
  action?: unknown
  resource?: unknown
  provider?: unknown
  params?: unknown
  filters?: unknown
  id?: unknown
  limit?: unknown
  include_provider_fields?: unknown
  [key: string]: unknown
}

export type ConnectedErpAdapterListInput = ConnectedDomainAdapterInput<ConnectedErpResource>
export type ConnectedErpAdapterReadInput = ConnectedDomainAdapterReadInput<ConnectedErpResource>
export type ConnectedErpAdapterResult = ConnectedDomainAdapterResult
