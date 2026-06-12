import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function merchantPath(credentials: { storeId?: string }, suffix: string) {
  return `/merchant/v1.0/merchants/${credentials.storeId || process.env.IFOOD_MERCHANT_ID || 'missing_merchant_id'}${suffix}`
}

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, size: pageSize }
}

export const IFOOD_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/merchant/v1.0/merchants', itemKeys: ['data', 'items', 'merchants'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query },
  { resource: 'products', path: '/merchant/v1.0/merchants/missing_merchant_id/catalogs', itemKeys: ['data', 'items', 'catalogs'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildPath: ({ credentials }) => merchantPath(credentials, '/catalogs'), buildQuery: query },
  { resource: 'orders', path: '/order/v1.0/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/order/v1.0/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query, transformItems: (items) => items.flatMap((order) => Array.isArray(order.items) ? order.items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id })) : []) },
  { resource: 'payments', path: '/order/v1.0/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/order/v1.0/orders', itemKeys: ['data', 'items', 'orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
]
