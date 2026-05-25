import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const ERP_RESOURCES: IntegrationResource[] = [
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
    slug: 'pedidos_venda',
    name: 'Pedidos de venda',
    description: 'Pedidos, itens, descontos e situacao comercial.',
    defaultEnabled: true,
  },
  {
    slug: 'compras',
    name: 'Compras',
    description: 'Pedidos de compra, itens e recebimentos.',
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
    slug: 'notas_fiscais',
    name: 'Notas fiscais',
    description: 'Documentos fiscais, emissoes, cancelamentos e valores.',
    defaultEnabled: false,
  },
  {
    slug: 'estoque',
    name: 'Estoque',
    description: 'Saldos, movimentacoes e almoxarifados.',
    defaultEnabled: false,
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
]

function erpProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'erp',
    resources: provider.resources || ERP_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['erp', 'financeiro', 'operacional', ...(provider.tags || [])],
  }
}

export const ERP_PROVIDERS: IntegrationProvider[] = [
  erpProvider({
    slug: 'conta_azul',
    toolkitSlug: 'CONTA_AZUL',
    name: 'Conta Azul',
    description: 'ERP financeiro, faturamento, vendas e conciliacao para pequenas e medias empresas.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['brasil', 'pme', 'financeiro'],
  }),
  erpProvider({
    slug: 'omie',
    toolkitSlug: 'OMIE',
    name: 'Omie',
    description: 'ERP com financeiro, fiscal, pedidos, estoque e automacao operacional.',
    authType: 'api_key',
    supportsOAuthCallback: false,
    tags: ['brasil', 'pme', 'fiscal'],
  }),
  erpProvider({
    slug: 'bling',
    toolkitSlug: 'BLING',
    name: 'Bling',
    description: 'ERP para ecommerce, estoque, pedidos, notas fiscais e marketplaces.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['brasil', 'ecommerce', 'marketplace'],
  }),
  erpProvider({
    slug: 'tiny',
    toolkitSlug: 'TINY',
    name: 'Tiny',
    description: 'ERP para vendas online, catalogo, estoque, pedidos e emissao fiscal.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['brasil', 'ecommerce', 'marketplace'],
  }),
  erpProvider({
    slug: 'totvs',
    toolkitSlug: 'TOTVS',
    name: 'TOTVS',
    description: 'ERP corporativo para dados financeiros, comerciais, fiscais e operacionais.',
    authType: 'manual',
    supportsOAuthCallback: false,
    tags: ['brasil', 'enterprise', 'operacional'],
  }),
]

export default ERP_PROVIDERS
