import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { offset: (page - 1) * pageSize, limit: pageSize }
}

function authQuery(credentials: { apiKey?: string; appKey?: string; appToken?: string }) {
  return {
    chave_api: credentials.apiKey,
    chave_aplicacao: credentials.appKey || credentials.appToken,
  }
}

function withAuth({ page, pageSize, credentials }: { page: number; pageSize: number; credentials: { apiKey?: string; appKey?: string; appToken?: string } }) {
  return {
    ...query({ page, pageSize }),
    ...authQuery(credentials),
  }
}

export const LOJA_INTEGRADA_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/api/v1/configuracao', itemKeys: ['objects', 'data', 'configuracao'], defaultPageSize: 1, supportsIncremental: false, buildQuery: ({ credentials }) => authQuery(credentials) },
  { resource: 'customers', path: '/api/v1/cliente', itemKeys: ['objects', 'data', 'clientes'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'products', path: '/api/v1/produto', itemKeys: ['objects', 'data', 'produtos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'variants', path: '/api/v1/produto', itemKeys: ['objects', 'data', 'produtos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth, transformItems: (items) => items.flatMap((product) => Array.isArray(product.variacoes) ? product.variacoes.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((variant) => ({ ...variant, product_id: product.id })) : []) },
  { resource: 'orders', path: '/api/v1/pedido', itemKeys: ['objects', 'data', 'pedidos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'order_items', path: '/api/v1/pedido', itemKeys: ['objects', 'data', 'pedidos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth, transformItems: (items) => items.flatMap((order) => Array.isArray(order.itens) ? order.itens.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id, order_number: order.numero })) : []) },
  { resource: 'payments', path: '/api/v1/pedido', itemKeys: ['objects', 'data', 'pedidos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'shipping', path: '/api/v1/pedido', itemKeys: ['objects', 'data', 'pedidos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'inventory', path: '/api/v1/produto', itemKeys: ['objects', 'data', 'produtos'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: withAuth },
  { resource: 'categories', path: '/api/v1/categoria', itemKeys: ['objects', 'data', 'categorias'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: withAuth },
]
