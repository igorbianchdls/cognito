import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function storePath(credentials: { storeId?: string }, suffix: string) {
  return `/${credentials.storeId || process.env.NUVEMSHOP_STORE_ID || 'missing_store_id'}${suffix}`
}

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, per_page: pageSize }
}

export const NUVEMSHOP_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/store', itemKeys: ['store'], defaultPageSize: 1, supportsIncremental: false },
  { resource: 'customers', path: '/missing_store_id/customers', itemKeys: ['customers', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/customers'), buildQuery: query },
  { resource: 'products', path: '/missing_store_id/products', itemKeys: ['products', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/products'), buildQuery: query },
  { resource: 'variants', path: '/missing_store_id/products', itemKeys: ['products', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/products'), buildQuery: query, transformItems: (items) => items.flatMap((product) => Array.isArray(product.variants) ? product.variants.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((variant) => ({ ...variant, product_id: product.id })) : []) },
  { resource: 'orders', path: '/missing_store_id/orders', itemKeys: ['orders', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/orders'), buildQuery: query },
  { resource: 'order_items', path: '/missing_store_id/orders', itemKeys: ['orders', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/orders'), buildQuery: query, transformItems: (items) => items.flatMap((order) => Array.isArray(order.products) ? order.products.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id, order_number: order.number })) : []) },
  { resource: 'payments', path: '/missing_store_id/orders', itemKeys: ['orders', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/orders'), buildQuery: query },
  { resource: 'refunds', path: '/missing_store_id/orders', itemKeys: ['orders', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/orders'), buildQuery: query },
  { resource: 'shipping', path: '/missing_store_id/orders', itemKeys: ['orders', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/orders'), buildQuery: query },
  { resource: 'inventory', path: '/missing_store_id/products', itemKeys: ['products', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => storePath(credentials, '/products'), buildQuery: query },
  { resource: 'categories', path: '/missing_store_id/categories', itemKeys: ['categories', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildPath: ({ credentials }) => storePath(credentials, '/categories'), buildQuery: query },
  { resource: 'coupons', path: '/missing_store_id/coupons', itemKeys: ['coupons', 'data'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildPath: ({ credentials }) => storePath(credentials, '/coupons'), buildQuery: query },
]
