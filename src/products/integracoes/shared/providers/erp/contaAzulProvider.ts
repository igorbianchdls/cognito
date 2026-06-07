import type { IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'
import { erpProvider } from '@/products/integracoes/shared/providers/erp/erpProviderFactory'

export const CONTA_AZUL_RESOURCES: IntegrationResource[] = [
  {
    slug: 'clientes',
    name: 'Clientes',
    description: 'Cadastro de clientes, documentos e dados comerciais.',
    defaultEnabled: true,
  },
  {
    slug: 'fornecedores',
    name: 'Fornecedores',
    description: 'Cadastro de fornecedores e parceiros de compra.',
    defaultEnabled: true,
  },
  {
    slug: 'produtos',
    name: 'Produtos',
    description: 'Catalogo de produtos, servicos e precos.',
    defaultEnabled: true,
  },
  {
    slug: 'contas_receber',
    name: 'Contas a receber',
    description: 'Titulos, vencimentos, recebimentos e inadimplencia.',
    defaultEnabled: true,
  },
  {
    slug: 'contas_pagar',
    name: 'Contas a pagar',
    description: 'Titulos, vencimentos, pagamentos e fornecedores.',
    defaultEnabled: true,
  },
  {
    slug: 'categorias',
    name: 'Categorias',
    description: 'Categorias financeiras e classificacoes operacionais.',
    defaultEnabled: false,
  },
  {
    slug: 'centros_custo',
    name: 'Centros de custo',
    description: 'Estrutura gerencial para rateios e analises.',
    defaultEnabled: false,
  },
  {
    slug: 'servicos',
    name: 'Servicos',
    description: 'Catalogo de servicos, precos e informacoes comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'vendas',
    name: 'Vendas',
    description: 'Vendas, clientes, valores, situacao e dados comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'itens_venda',
    name: 'Itens de venda',
    description: 'Produtos e servicos vinculados as vendas.',
    defaultEnabled: false,
  },
  {
    slug: 'parcelas_venda',
    name: 'Parcelas de venda',
    description: 'Parcelas, vencimentos, valores e situacao de pagamento das vendas.',
    defaultEnabled: false,
  },
  {
    slug: 'contratos',
    name: 'Contratos',
    description: 'Contratos recorrentes, clientes, valores e periodicidade.',
    defaultEnabled: false,
  },
  {
    slug: 'contas_bancarias',
    name: 'Contas bancarias',
    description: 'Contas bancarias e carteiras usadas no financeiro.',
    defaultEnabled: false,
  },
  {
    slug: 'vendedores',
    name: 'Vendedores',
    description: 'Cadastro de vendedores e responsaveis comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'notas_fiscais',
    name: 'Notas fiscais',
    description: 'Notas fiscais emitidas, chaves, valores e status fiscais.',
    defaultEnabled: false,
  },
  {
    slug: 'estoque',
    name: 'Estoque',
    description: 'Saldos e posicao de estoque quando disponivel na conta.',
    defaultEnabled: false,
  },
  {
    slug: 'movimentacoes_estoque',
    name: 'Movimentacoes de estoque',
    description: 'Entradas, saidas e ajustes de estoque.',
    defaultEnabled: false,
  },
]

export const CONTA_AZUL_PROVIDER = erpProvider({
  slug: 'conta_azul',
  toolkitSlug: 'CONTA_AZUL',
  name: 'Conta Azul',
  description: 'ERP financeiro, faturamento, vendas e conciliacao para pequenas e medias empresas.',
  authType: 'oauth2',
  supportsOAuthCallback: true,
  resources: CONTA_AZUL_RESOURCES,
  tags: ['brasil', 'pme', 'financeiro'],
})
