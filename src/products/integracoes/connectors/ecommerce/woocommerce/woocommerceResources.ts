import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, per_page: pageSize }
}

export const WOOCOMMERCE_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/wp-json/wc/v3/system_status', itemKeys: ['environment'], defaultPageSize: 1, supportsIncremental: false },
  { resource: 'customers', path: '/wp-json/wc/v3/customers', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'products', path: '/wp-json/wc/v3/products', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'variants', path: '/wp-json/wc/v3/products', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'orders', path: '/wp-json/wc/v3/orders', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/wp-json/wc/v3/orders', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.flatMap((order) => Array.isArray(order.line_items) ? order.line_items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id, order_number: order.number })) : []) },
  { resource: 'payments', path: '/wp-json/wc/v3/orders', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/wp-json/wc/v3/refunds', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'shipping', path: '/wp-json/wc/v3/orders', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'inventory', path: '/wp-json/wc/v3/products', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'categories', path: '/wp-json/wc/v3/products/categories', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query },
  { resource: 'coupons', path: '/wp-json/wc/v3/coupons', itemKeys: ['data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query },
]
