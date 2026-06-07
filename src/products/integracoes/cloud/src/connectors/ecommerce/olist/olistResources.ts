import type { EcommerceResourceConfig } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, limit: pageSize }
}

export const OLIST_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/stores', itemKeys: ['data', 'items', 'stores'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query },
  { resource: 'customers', path: '/customers', itemKeys: ['data', 'items', 'customers'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'products', path: '/products', itemKeys: ['data', 'items', 'products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'variants', path: '/products', itemKeys: ['data', 'items', 'products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'orders', path: '/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.flatMap((order) => Array.isArray(order.items) ? order.items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id })) : []) },
  { resource: 'payments', path: '/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'shipping', path: '/shipments', itemKeys: ['data', 'items', 'shipments'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'inventory', path: '/inventory', itemKeys: ['data', 'items', 'inventory'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
]
