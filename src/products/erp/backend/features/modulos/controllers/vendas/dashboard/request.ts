export type VendasDashboardRequest = {
  de?: string
  ate?: string
  limit: number
  pWhere: string
  pParams: unknown[]
  cdWhere: string
  vmWhere: string
  vmParams: unknown[]
  dWhere: string
  dParams: unknown[]
}

export function buildVendasDashboardRequest(searchParams: URLSearchParams): VendasDashboardRequest {
  const de = searchParams.get('de') || undefined
  const ate = searchParams.get('ate') || undefined
  const limitParam = searchParams.get('limit') || undefined
  const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 5))

  const pConds: string[] = []
  const pParams: unknown[] = []
  let pi = 1
  if (de) { pConds.push(`p.data_pedido >= $${pi++}`); pParams.push(de) }
  if (ate) { pConds.push(`p.data_pedido <= $${pi++}`); pParams.push(ate) }
  const pWhere = pConds.length ? `WHERE ${pConds.join(' AND ')}` : ''
  const cdWhere = pWhere ? `${pWhere} AND p.status = 'concluido'` : `WHERE p.status = 'concluido'`

  const vmConds: string[] = []
  const vmParams: unknown[] = []
  if (de) { vmConds.push(`data_pedido >= $${vmParams.length + 1}`); vmParams.push(de) }
  if (ate) { vmConds.push(`data_pedido <= $${vmParams.length + 1}`); vmParams.push(ate) }
  const vmWhere = vmConds.length ? `WHERE ${vmConds.join(' AND ')}` : ''

  const dConds: string[] = []
  const dParams: unknown[] = []
  let di = 1
  if (de) { dConds.push(`d.data_devolucao >= $${di++}`); dParams.push(de) }
  if (ate) { dConds.push(`d.data_devolucao <= $${di++}`); dParams.push(ate) }
  const dWhere = dConds.length ? `WHERE ${dConds.join(' AND ')}` : ''

  return { de, ate, limit, pWhere, pParams, cdWhere, vmWhere, vmParams, dWhere, dParams }
}
