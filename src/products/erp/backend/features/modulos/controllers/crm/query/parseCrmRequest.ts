type OrderWhitelist = Record<string, string>

export type ParsedCrmRequest = {
  view: string
  de?: string
  ate?: string
  q?: string
  responsavel_id?: string
  status?: string
  origem?: string
  tipo?: string
  canal?: string
  page: number
  pageSize: number
  offset: number
  orderBy?: string
  orderDir: 'ASC' | 'DESC'
}

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb)

export function parseCrmRequest(
  searchParams: URLSearchParams,
  orderWhitelistByView: Record<string, OrderWhitelist>,
): ParsedCrmRequest {
  const view = (searchParams.get('view') || '').toLowerCase()

  const de = searchParams.get('de') || undefined
  const ate = searchParams.get('ate') || undefined
  const q = searchParams.get('q') || undefined
  const responsavel_id = searchParams.get('responsavel_id') || undefined
  const status = searchParams.get('status') || undefined
  const origem = searchParams.get('origem') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const canal = searchParams.get('canal') || undefined

  const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
  const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20))
  const offset = (page - 1) * pageSize

  const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
  const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
  const whitelist = orderWhitelistByView[view] || {}
  const orderBy = whitelist[orderByParam] || undefined
  const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

  return {
    view,
    de,
    ate,
    q,
    responsavel_id,
    status,
    origem,
    tipo,
    canal,
    page,
    pageSize,
    offset,
    orderBy,
    orderDir,
  }
}
