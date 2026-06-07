import type { EcommerceResourceConfig } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, max_results: pageSize }
}

export const HOTMART_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/products/api/v1/products', itemKeys: ['items', 'products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query },
  { resource: 'customers', path: '/payments/api/v1/sales/history', itemKeys: ['items', 'sales'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.map((sale) => typeof sale.buyer === 'object' && sale.buyer !== null && !Array.isArray(sale.buyer) ? sale.buyer as Record<string, unknown> : sale) },
  { resource: 'products', path: '/products/api/v1/products', itemKeys: ['items', 'products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'orders', path: '/payments/api/v1/sales/history', itemKeys: ['items', 'sales'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/payments/api/v1/sales/history', itemKeys: ['items', 'sales'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.map((sale) => ({ ...(typeof sale.product === 'object' && sale.product !== null && !Array.isArray(sale.product) ? sale.product : {}), sale_id: sale.purchase, transaction: sale.transaction })) },
  { resource: 'payments', path: '/payments/api/v1/sales/history', itemKeys: ['items', 'sales'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/payments/api/v1/sales/history', itemKeys: ['items', 'sales'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
]
