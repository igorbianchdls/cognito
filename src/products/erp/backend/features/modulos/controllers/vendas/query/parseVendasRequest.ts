type OrderWhitelist = Record<string, string>

export type ParsedVendasRequest = {
  view: string
  page: number
  pageSize: number
  offset: number
  orderBy?: string
  orderDir: 'ASC' | 'DESC'
}

export function parseVendasRequest(
  searchParams: URLSearchParams,
  orderWhitelistByView: Record<string, OrderWhitelist>,
): ParsedVendasRequest {
  const view = (searchParams.get('view') || '').toLowerCase()
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 20)))
  const offset = (page - 1) * pageSize

  const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
  const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase()
  const whitelist = orderWhitelistByView[view] || {}
  const orderBy = whitelist[orderByParam]
  const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC'

  return { view, page, pageSize, offset, orderBy, orderDir }
}
