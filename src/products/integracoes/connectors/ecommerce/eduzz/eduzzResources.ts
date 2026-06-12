import type { EcommerceResourceConfig } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'

const DEFAULT_PAGE_SIZE = 100

function query({ page, pageSize }: { page: number; pageSize: number }) {
  return { page, per_page: pageSize }
}

export const EDUZZ_RESOURCES: EcommerceResourceConfig[] = [
  { resource: 'stores', path: '/api/1.0/myeduzz/user', itemKeys: ['data', 'items'], defaultPageSize: 1, supportsIncremental: false },
  { resource: 'customers', path: '/api/1.0/sale/get_sale_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'products', path: '/api/1.0/producer/product_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'orders', path: '/api/1.0/sale/get_sale_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'order_items', path: '/api/1.0/sale/get_sale_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'payments', path: '/api/1.0/sale/get_sale_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
  { resource: 'refunds', path: '/api/1.0/sale/get_sale_list', itemKeys: ['data', 'items'], defaultPageSize: DEFAULT_PAGE_SIZE, supportsIncremental: true, buildQuery: query },
]
