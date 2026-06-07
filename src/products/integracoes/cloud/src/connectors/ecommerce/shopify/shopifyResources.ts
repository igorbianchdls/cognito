import type { EcommerceResourceConfig } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10'
const DEFAULT_PAGE_SIZE = 100

function path(resource: string) {
  return `/admin/api/${API_VERSION}/${resource}.json`
}

function query(root: string) {
  return ({ pageSize, cursor }: { pageSize: number; cursor?: Record<string, unknown> }) => ({
    limit: pageSize,
    page_info: cursor?.page_info as string | undefined,
    status: root === 'orders' ? 'any' : undefined,
  })
}

export const SHOPIFY_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: `/admin/api/${API_VERSION}/shop.json`, itemKeys: ['shop'], defaultPageSize: 1, supportsIncremental: false },
  { resource: 'customers', path: path('customers'), itemKeys: ['customers'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('customers') },
  { resource: 'products', path: path('products'), itemKeys: ['products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('products') },
  { resource: 'variants', path: path('products'), itemKeys: ['products'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('products'), transformItems: (items) => items.flatMap((product) => Array.isArray(product.variants) ? product.variants.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((variant) => ({ ...variant, product_id: product.id })) : []) },
  { resource: 'orders', path: path('orders'), itemKeys: ['orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('orders') },
  { resource: 'order_items', path: path('orders'), itemKeys: ['orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('orders'), transformItems: (items) => items.flatMap((order) => Array.isArray(order.line_items) ? order.line_items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({ ...item, order_id: order.id, order_name: order.name })) : []) },
  { resource: 'payments', path: path('transactions'), itemKeys: ['transactions'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('transactions') },
  { resource: 'refunds', path: path('orders'), itemKeys: ['orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('orders'), transformItems: (items) => items.flatMap((order) => Array.isArray(order.refunds) ? order.refunds.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((refund) => ({ ...refund, order_id: order.id })) : []) },
  { resource: 'shipping', path: path('orders'), itemKeys: ['orders'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('orders'), transformItems: (items) => items.flatMap((order) => Array.isArray(order.fulfillments) ? order.fulfillments.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)).map((fulfillment) => ({ ...fulfillment, order_id: order.id })) : []) },
  { resource: 'inventory', path: path('inventory_levels'), itemKeys: ['inventory_levels'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('inventory_levels') },
  { resource: 'categories', path: path('custom_collections'), itemKeys: ['custom_collections'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query('custom_collections') },
  { resource: 'coupons', path: path('price_rules'), itemKeys: ['price_rules'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: false, buildQuery: query('price_rules') },
  { resource: 'abandoned_checkouts', path: path('checkouts'), itemKeys: ['checkouts'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query('checkouts') },
]
