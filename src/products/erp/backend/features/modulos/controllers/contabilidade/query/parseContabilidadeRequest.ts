type OrderWhitelist = Record<string, string>

export type ParsedContabilidadeRequest = {
  view: string
  de?: string
  ate?: string
  cliente_id?: string
  fornecedor_id?: string
  page: number
  pageSize: number
  offset: number
  orderBy?: string
  orderDir: 'ASC' | 'DESC'
}

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export function parseContabilidadeRequest(
  searchParams: URLSearchParams,
  orderWhitelistByView: Record<string, OrderWhitelist>,
): ParsedContabilidadeRequest {
  const view = (searchParams.get('view') || '').toLowerCase()
  const de = searchParams.get('de') || undefined
  const ate = searchParams.get('ate') || undefined
  const cliente_id = searchParams.get('cliente_id') || undefined
  const fornecedor_id = searchParams.get('fornecedor_id') || undefined

  const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
  const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000))
  const offset = (page - 1) * pageSize

  const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
  const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
  const orderWhitelist = orderWhitelistByView[view] || {}
  const orderBy = orderWhitelist[orderByParam] || undefined
  const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

  return {
    view,
    de,
    ate,
    cliente_id,
    fornecedor_id,
    page,
    pageSize,
    offset,
    orderBy,
    orderDir,
  }
}
