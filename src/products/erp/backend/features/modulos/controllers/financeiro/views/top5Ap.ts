import { runQuery } from '@/lib/postgres'
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest'

type Input = {
  searchParams: URLSearchParams
  parsed: ParsedFinanceiroRequest
}

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export async function maybeHandleFinanceiroTop5ApView({
  searchParams,
  parsed,
}: Input): Promise<Response | null> {
  const { view, de, ate } = parsed
  if (view !== 'top5-ap') return null

  const dim = (searchParams.get('dim') || '').toLowerCase()
  const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5))
  const tenantId = parseNumber(searchParams.get('tenant_id'))

  const params: unknown[] = []
  let idx = 1
  const filtros: string[] = []
  const statusParam = (searchParams.get('status') || 'aberto').toLowerCase()
  if (statusParam === 'aberto') {
    filtros.push(`LOWER(cp.status) IN ('aberto','pendente','em_aberto','em aberto')`)
  } else {
    filtros.push(`LOWER(cp.status) = $${idx++}`)
    params.push(statusParam)
  }
  if (de) {
    filtros.push(`cp.data_vencimento >= $${idx++}`)
    params.push(de)
  }
  if (ate) {
    filtros.push(`cp.data_vencimento <= $${idx++}`)
    params.push(ate)
  }
  if (tenantId) {
    filtros.push(`cp.tenant_id = $${idx++}`)
    params.push(tenantId)
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

  if (dim === 'titulo') {
    const sql = `
      SELECT cp.id AS conta_pagar_id,
             COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text)) AS label,
             cp.valor_liquido AS total
        FROM financeiro.contas_pagar cp
        ${where}
       ORDER BY cp.valor_liquido DESC NULLS LAST
       LIMIT ${limit}
    `.replace(/\n\s+/g, ' ').trim()
    const rows = await runQuery<{ conta_pagar_id: number; label: string; total: number | null }>(sql, params)
    return Response.json({ success: true, dim: 'titulo', rows, sql_query: sql, sql_params: params })
  }

  let labelExpr = ''
  if (dim === 'fornecedor') labelExpr = "COALESCE(f.nome_fantasia, 'Sem fornecedor')"
  else if (dim === 'centro_custo' || dim === 'centro-custo') labelExpr = "COALESCE(cc.nome, 'Sem centro de custo')"
  else if (dim === 'filial') labelExpr = "COALESCE(fil.nome, 'Sem filial')"
  else if (dim === 'categoria') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
  else if (dim === 'departamento') labelExpr = "COALESCE(dep.nome, 'Sem departamento')"
  else if (dim === 'unidade_negocio' || dim === 'unidade-negocio') labelExpr = "COALESCE(un.nome, 'Sem unidade')"
  else {
    return Response.json(
      { success: false, message: "Parâmetro 'dim' inválido. Use 'fornecedor' | 'centro_custo' | 'filial' | 'categoria' | 'departamento' | 'unidade_negocio' | 'titulo'" },
      { status: 400 },
    )
  }

  const sql = `
    SELECT ${labelExpr} AS label,
           COALESCE(SUM(cp.valor_liquido), 0) AS total
      FROM financeiro.contas_pagar cp
      LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
      LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
      LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
      LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
      LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
      LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
      ${where}
     GROUP BY 1
     ORDER BY total DESC NULLS LAST
     LIMIT ${limit}
  `.replace(/\n\s+/g, ' ').trim()
  const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
  return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })
}
