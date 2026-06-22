import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const ECOMMERCE_RESOURCES: IntegrationResource[] = [
  {
    slug: 'stores',
    name: 'Lojas',
    description: 'Lojas, contas, sellers ou propriedades conectadas.',
    defaultEnabled: true,
  },
  {
    slug: 'customers',
    name: 'Clientes',
    description: 'Clientes, compradores e contatos de ecommerce.',
    defaultEnabled: true,
  },
  {
    slug: 'products',
    name: 'Produtos',
    description: 'Catalogo de produtos, ofertas e SKUs.',
    defaultEnabled: true,
  },
  {
    slug: 'variants',
    name: 'Variantes',
    description: 'Variantes, grades e SKUs derivados de produtos.',
    defaultEnabled: false,
  },
  {
    slug: 'orders',
    name: 'Pedidos',
    description: 'Pedidos, vendas e compras realizadas.',
    defaultEnabled: true,
  },
  {
    slug: 'order_items',
    name: 'Itens de pedido',
    description: 'Itens, linhas e produtos vendidos dentro de pedidos.',
    defaultEnabled: true,
  },
  {
    slug: 'payments',
    name: 'Pagamentos',
    description: 'Pagamentos, transacoes, repasses e status financeiro.',
    defaultEnabled: true,
  },
  {
    slug: 'refunds',
    name: 'Reembolsos',
    description: 'Reembolsos, cancelamentos e chargebacks.',
    defaultEnabled: false,
  },
  {
    slug: 'shipping',
    name: 'Entregas',
    description: 'Fretes, entregas, fulfillments e transportadoras.',
    defaultEnabled: false,
  },
  {
    slug: 'inventory',
    name: 'Estoque',
    description: 'Niveis e movimentacoes basicas de estoque quando disponiveis.',
    defaultEnabled: false,
  },
  {
    slug: 'categories',
    name: 'Categorias',
    description: 'Categorias, colecoes e agrupamentos de produtos.',
    defaultEnabled: false,
  },
  {
    slug: 'coupons',
    name: 'Cupons',
    description: 'Cupons, descontos e promocoes.',
    defaultEnabled: false,
  },
  {
    slug: 'abandoned_checkouts',
    name: 'Carrinhos abandonados',
    description: 'Checkouts, carrinhos e compras nao finalizadas.',
    defaultEnabled: false,
  },
]

function ecommerceProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'ecommerce',
    resources: provider.resources || ECOMMERCE_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['ecommerce', ...(provider.tags || [])],
  }
}

export const ECOMMERCE_PROVIDERS: IntegrationProvider[] = [
  ecommerceProvider({
    slug: 'shopify',
    toolkitSlug: 'SHOPIFY',
    name: 'Shopify',
    description: 'Loja online com pedidos, produtos, clientes, estoque, pagamentos e checkouts.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['loja-online', 'global'],
  }),
  ecommerceProvider({
    slug: 'nuvemshop',
    toolkitSlug: 'NUVEMSHOP',
    name: 'Nuvemshop',
    description: 'Ecommerce brasileiro com pedidos, produtos, clientes, categorias e variantes.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['loja-online', 'brasil'],
  }),
  ecommerceProvider({
    slug: 'loja_integrada',
    toolkitSlug: 'LOJA_INTEGRADA',
    name: 'Loja Integrada',
    description: 'Plataforma brasileira de ecommerce com pedidos, produtos, clientes e categorias.',
    authType: 'api_key',
    supportsOAuthCallback: false,
    tags: ['marketplace', 'brasil'],
  }),
]

export default ECOMMERCE_PROVIDERS
