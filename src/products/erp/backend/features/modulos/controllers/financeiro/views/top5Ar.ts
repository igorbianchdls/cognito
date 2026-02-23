import { runQuery } from '@/lib/postgres'
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest'

type Input = {
  searchParams: URLSearchParams
  parsed: ParsedFinanceiroRequest
}

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export async function maybeHandleFinanceiroTop5ArView({
  searchParams,
  parsed,
}: Input): Promise<Response | null> {
  const { view, de, ate } = parsed
  if (view !== 'top5-ar') return null

  const dim = (searchParams.get('dim') || '').toLowerCase()
  const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5))
  const tenantId = parseNumber(searchParams.get('tenant_id'))

  const params: unknown[] = []
  let idx = 1
  const filtros: string[] = []
  const statusParam = (searchParams.get('status') || 'aberto').toLowerCase()
  if (statusParam === 'aberto') {
    filtros.push(`LOWER(cr.status) IN ('aberto','pendente','em_aberto','em aberto')`)
  } else {
    filtros.push(`LOWER(cr.status) = $${idx++}`)
    params.push(statusParam)
  }
  if (de) {
    filtros.push(`cr.data_vencimento >= $${idx++}`)
    params.push(de)
  }
  if (ate) {
    filtros.push(`cr.data_vencimento <= $${idx++}`)
    params.push(ate)
  }
  if (tenantId) {
    filtros.push(`cr.tenant_id = $${idx++}`)
    params.push(tenantId)
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

  let labelExpr = ''
  if (dim === 'categoria' || dim === 'categoria_receita') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
  else if (dim === 'centro_lucro' || dim === 'centro-lucro') labelExpr = "COALESCE(cl.nome, 'Sem centro de lucro')"
  else {
    return Response.json(
      { success: false, message: "Parâmetro 'dim' inválido. Use 'categoria' | 'centro_lucro'" },
      { status: 400 },
    )
  }

  const sql = `
    SELECT ${labelExpr} AS label,
           COALESCE(SUM(cr.valor_liquido), 0) AS total
      FROM financeiro.contas_receber cr
      LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
      LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
      ${where}
     GROUP BY 1
     ORDER BY total DESC NULLS LAST
     LIMIT ${limit}
  `.replace(/\n\s+/g, ' ').trim()
  const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
  return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })
}
