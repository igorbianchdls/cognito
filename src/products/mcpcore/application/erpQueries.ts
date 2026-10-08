// Plugin transport consumes the same read operations as the ERP HTTP API.
export { erpReadService as erpQueries, type ErpReadService as ErpQueries } from '@/products/erp/server/erpReadService'
export type { ErpReadPageQuery as PageQuery } from '@/products/erp/shared/readQueries'
