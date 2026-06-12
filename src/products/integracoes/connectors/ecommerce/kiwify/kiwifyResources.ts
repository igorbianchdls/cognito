import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, per_page: pageSize }
}

export const KIWIFY_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/v1/account', itemKeys: ['data', 'account'], defaultPageSize: 1, supportsIncremental: false },
  { resource: 'customers', path: '/v1/sales', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.map((sale) => typeof sale.customer === 'object' && sale.customer !== null && !Array.isArray(sale.customer) ? sale.customer as Record<string, unknown> : sale) },
  { resource: 'products', path: '/v1/products', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'orders', path: '/v1/sales', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/v1/sales', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.map((sale) => ({ ...(typeof sale.product === 'object' && sale.product !== null && !Array.isArray(sale.product) ? sale.product : {}), sale_id: sale.id })) },
  { resource: 'payments', path: '/v1/sales', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/v1/sales', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
]
