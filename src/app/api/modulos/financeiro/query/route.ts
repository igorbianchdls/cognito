import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure'|'dimension'|string; dir?: 'asc'|'desc' }

type DataQuery = {
  model: string
  dimension: string
  measure: string
  filters?: Record<string, unknown>
  orderBy?: OrderBy
  limit?: number
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const dq = body?.dataQuery as unknown
    if (!isObject(dq)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const model = rawModel.replace(/-/g, '_') // permitir contas-a-pagar
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim() : ''
    const dimensionExprOverride = typeof (dq as any).dimensionExpr === 'string' ? (dq as any).dimensionExpr.trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 5))

    // Support models: financeiro.contas_pagar, financeiro.contas_receber
    let ctx: {
      from: string
      defaultDate: string
      dimMap: Map<string, { expr: string; alias: string }>
      measureMap: Map<string, { expr: string; alias: string }>
    } | null = null

    if (model === 'financeiro.contas_pagar') {
      ctx = {
        from: `FROM financeiro.contas_pagar cp
               LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
               LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
               LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
               LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
               LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
               LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
               LEFT JOIN financeiro.projetos pr ON pr.id = cp.projeto_id`,
        defaultDate: 'cp.data_vencimento',
        dimMap: new Map([
          ['fornecedor', { expr: "COALESCE(f.nome_fantasia,'Sem fornecedor')", alias: 'fornecedor' }],
          ['centro_custo', { expr: "COALESCE(cc.nome,'Sem centro de custo')", alias: 'centro_custo' }],
          ['departamento', { expr: "COALESCE(dep.nome,'Sem departamento')", alias: 'departamento' }],
          ['unidade_negocio', { expr: "COALESCE(un.nome,'Sem unidade')", alias: 'unidade_negocio' }],
          ['filial', { expr: "COALESCE(fil.nome,'Sem filial')", alias: 'filial' }],
          ['projeto', { expr: "COALESCE(pr.nome,'Sem projeto')", alias: 'projeto' }],
          ['categoria_despesa', { expr: "COALESCE(cd.nome,'Sem categoria')", alias: 'categoria_despesa' }],
          ['categoria', { expr: "COALESCE(cd.nome,'Sem categoria')", alias: 'categoria' }],
          ['status', { expr: "COALESCE(cp.status,'—')", alias: 'status' }],
          ['titulo', { expr: "COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text))", alias: 'titulo' }],
          ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', cp.data_vencimento), 'YYYY-MM')", alias: 'periodo' }],
        ]),
        measureMap: new Map([
          ['sum(valor_liquido)', { expr: 'COALESCE(SUM(cp.valor_liquido),0)::float', alias: 'valor_total' }],
          ['sum(valor)', { expr: 'COALESCE(SUM(cp.valor_liquido),0)::float', alias: 'valor_total' }],
          ['count()', { expr: 'COUNT(*)::int', alias: 'count' }],
        ]),
      }
    } else if (model === 'financeiro.contas_receber') {
      ctx = {
        from: `FROM financeiro.contas_receber cr
               LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
               LEFT JOIN financeiro.categorias_receita crcat ON crcat.id = cr.categoria_receita_id
               LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
               LEFT JOIN empresa.departamentos dep ON dep.id = cr.departamento_id
               LEFT JOIN empresa.unidades_negocio un ON un.id = cr.unidade_negocio_id
               LEFT JOIN empresa.filiais fil ON fil.id = cr.filial_id
               LEFT JOIN financeiro.projetos pr ON pr.id = cr.projeto_id`,
        defaultDate: 'cr.data_vencimento',
        dimMap: new Map([
          ['cliente', { expr: "COALESCE(cli.nome_fantasia,'Sem cliente')", alias: 'cliente' }],
          ['centro_lucro', { expr: "COALESCE(cl.nome,'Sem centro de lucro')", alias: 'centro_lucro' }],
          ['departamento', { expr: "COALESCE(dep.nome,'Sem departamento')", alias: 'departamento' }],
          ['unidade_negocio', { expr: "COALESCE(un.nome,'Sem unidade')", alias: 'unidade_negocio' }],
          ['filial', { expr: "COALESCE(fil.nome,'Sem filial')", alias: 'filial' }],
          ['projeto', { expr: "COALESCE(pr.nome,'Sem projeto')", alias: 'projeto' }],
          ['categoria_receita', { expr: "COALESCE(crcat.nome,'Sem categoria')", alias: 'categoria_receita' }],
          ['categoria', { expr: "COALESCE(crcat.nome,'Sem categoria')", alias: 'categoria' }],
          ['status', { expr: "COALESCE(cr.status,'—')", alias: 'status' }],
          ['titulo', { expr: "COALESCE(NULLIF(TRIM(cr.numero_documento), ''), CONCAT('Conta #', cr.id::text))", alias: 'titulo' }],
          ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'YYYY-MM')", alias: 'periodo' }],
        ]),
        measureMap: new Map([
          ['sum(valor_liquido)', { expr: 'COALESCE(SUM(cr.valor_liquido),0)::float', alias: 'valor_total' }],
          ['sum(valor)', { expr: 'COALESCE(SUM(cr.valor_liquido),0)::float', alias: 'valor_total' }],
          ['count()', { expr: 'COUNT(*)::int', alias: 'count' }],
        ]),
      }
    }

    if (!ctx) {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    const dimKey = (dimension || '').toLowerCase()
    let dim = dimKey ? ctx.dimMap.get(dimKey) : undefined
    if (dimensionExprOverride) {
      const qualifyDimExpr = (expr: string) => {
        const alias = ctx.from.includes(' cp') ? 'cp' : 'cr'
        let e = expr
        e = e.replace(/\bdata_vencimento\b/g, `${alias}.data_vencimento`)
        e = e.replace(/\bvalor_liquido\b/g, `${alias}.valor_liquido`)
        e = e.replace(/\bvalor\b/g, `${alias}.valor_liquido`)
        return e
      }
      dim = { expr: qualifyDimExpr(dimensionExprOverride), alias: dimension || 'dimension' }
    } else {
      if (dimKey && !dim) {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    const mKey = measure.replace(/\s+/g, '').toLowerCase()
    const meas = ctx.measureMap.get(mKey)
    if (!meas) {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    // Filters
    const params: unknown[] = []
    const whereParts: string[] = []
    const f = filters as Record<string, unknown>
    const alias = ctx.from.includes(' cp') ? 'cp' : 'cr'
    if (typeof f.tenant_id === 'number') { whereParts.push(`${alias}.tenant_id = $${params.length + 1}`); params.push(f.tenant_id) }
    if (typeof f.de === 'string') { whereParts.push(`${ctx.defaultDate} >= $${params.length + 1}`); params.push(f.de) }
    if (typeof f.ate === 'string') { whereParts.push(`${ctx.defaultDate} <= $${params.length + 1}`); params.push(f.ate) }
    if (typeof f.status === 'string') { whereParts.push(`LOWER(${alias}.status) = LOWER($${params.length + 1})`); params.push(f.status) }
    // Common id filters
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v))
    const addInFilter = (col: string, val: unknown) => {
      if (Array.isArray(val)) {
        const arr = val as unknown[];
        if (!arr.length) return;
        const ph: string[] = [];
        for (const v of arr) { ph.push(`$${params.length + 1}`); params.push(v as any); }
        whereParts.push(`${col} IN (${ph.join(',')})`);
      } else if (num(val)) {
        whereParts.push(`${col} = $${params.length + 1}`);
        params.push(val as number);
      }
    };
    if (alias === 'cp') {
      addInFilter('cp.fornecedor_id', f.fornecedor_id);
      addInFilter('cp.categoria_despesa_id', f.categoria_despesa_id);
      addInFilter('cp.centro_custo_id', f.centro_custo_id);
      addInFilter('cp.departamento_id', f.departamento_id);
      addInFilter('cp.unidade_negocio_id', f.unidade_negocio_id);
      addInFilter('cp.filial_id', f.filial_id);
      addInFilter('cp.projeto_id', f.projeto_id);
      if (typeof f.numero_documento === 'string' && f.numero_documento.trim()) { whereParts.push(`cp.numero_documento ILIKE '%' || $${params.length + 1} || '%'`); params.push(f.numero_documento) }
      if (num(f.valor_min)) { whereParts.push(`cp.valor_liquido >= $${params.length + 1}`); params.push(f.valor_min as number) }
      if (num(f.valor_max)) { whereParts.push(`cp.valor_liquido <= $${params.length + 1}`); params.push(f.valor_max as number) }
    } else {
      addInFilter('cr.cliente_id', f.cliente_id);
      addInFilter('cr.categoria_receita_id', f.categoria_receita_id);
      addInFilter('cr.centro_lucro_id', f.centro_lucro_id);
      addInFilter('cr.departamento_id', f.departamento_id);
      addInFilter('cr.unidade_negocio_id', f.unidade_negocio_id);
      addInFilter('cr.filial_id', f.filial_id);
      addInFilter('cr.projeto_id', f.projeto_id);
      if (typeof f.numero_documento === 'string' && f.numero_documento.trim()) { whereParts.push(`cr.numero_documento ILIKE '%' || $${params.length + 1} || '%'`); params.push(f.numero_documento) }
      if (num(f.valor_min)) { whereParts.push(`cr.valor_liquido >= $${params.length + 1}`); params.push(f.valor_min as number) }
      if (num(f.valor_max)) { whereParts.push(`cr.valor_liquido <= $${params.length + 1}`); params.push(f.valor_max as number) }
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Order by
    let sql: string
    let execParams: unknown[]
    if (!dim) {
      // Aggregate only (KPI): no grouping
      sql = `SELECT ${meas.expr} AS value ${ctx.from} ${whereSql}`.replace(/\s+/g, ' ').trim()
      execParams = params
    } else {
      const dir = (orderBy?.dir && orderBy.dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
      const obField = (orderBy?.field === 'dimension') ? '1' : '2'
      const orderSql = `ORDER BY ${obField} ${dir}`
      sql = `SELECT ${dim.expr} AS label, ${meas.expr} AS value
             ${ctx.from}
             ${whereSql}
             GROUP BY 1
             ${orderSql}
             LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      execParams = [...params, limit]
    }

    const rows = await runQuery<Record<string, unknown>>(sql, execParams)
    return Response.json({ success: true, rows, sql_query: sql, sql_params: [...params, limit] })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/query error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
