import { NextRequest } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure' | 'dimension' | string; dir?: 'asc' | 'desc' }

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function normalizeExprKey(v: string): string {
  return v.replace(/\s+/g, '').toLowerCase()
}

function qualifyDimensionExpr(expr: string): string {
  let out = expr
  const cols = [
    'data_ref',
    'gasto',
    'receita_atribuida',
    'cliques',
    'impressoes',
    'conversoes',
    'leads',
    'alcance',
    'frequencia',
    'plataforma',
    'nivel',
  ]
  for (const col of cols) {
    out = out.replace(new RegExp(`\\b${col}\\b`, 'g'), `dd.${col}`)
  }
  return out
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function addEqOrInFilter(params: unknown[], whereParts: string[], col: string, value: unknown) {
  if (Array.isArray(value)) {
    const arr = value.filter((v) => v !== null && v !== undefined)
    if (!arr.length) return
    const ph: string[] = []
    for (const item of arr) {
      ph.push(`$${params.length + 1}`)
      params.push(item)
    }
    whereParts.push(`${col} IN (${ph.join(',')})`)
    return
  }

  if (typeof value === 'string' && value.trim()) {
    whereParts.push(`${col} = $${params.length + 1}`)
    params.push(value.trim())
    return
  }

  if (isFiniteNumber(value)) {
    whereParts.push(`${col} = $${params.length + 1}`)
    params.push(value)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const dq = body?.dataQuery
    if (!isObject(dq)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const model = rawModel.replace(/-/g, '_')
    if (model !== 'trafegopago.desempenho_diario') {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim() : ''
    const dimensionExprOverride = typeof (dq as any).dimensionExpr === 'string' ? String((dq as any).dimensionExpr).trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    if (!measure) {
      return Response.json({ success: false, message: 'Medida obrigatória' }, { status: 400 })
    }

    const tenantId = resolveTenantId(req.headers)
    const rawFilters = isObject(dq.filters) ? dq.filters : {}
    const filters: Record<string, unknown> =
      typeof rawFilters.tenant_id === 'number' ? rawFilters : { ...rawFilters, tenant_id: tenantId }
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 8))

    const fromSql = `
      FROM trafegopago.desempenho_diario dd
      LEFT JOIN trafegopago.contas_midia cm ON cm.id = dd.conta_id
      LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id
      LEFT JOIN trafegopago.grupos_anuncio ga ON ga.id = dd.grupo_id
      LEFT JOIN trafegopago.anuncios a ON a.id = dd.anuncio_id
    `.replace(/\s+/g, ' ').trim()

    const dimMap = new Map<string, { expr: string; keyExpr?: string; alias: string }>([
      ['plataforma', { expr: "COALESCE(dd.plataforma,'—')", keyExpr: "COALESCE(dd.plataforma,'—')", alias: 'plataforma' }],
      ['nivel', { expr: "COALESCE(dd.nivel,'—')", keyExpr: "COALESCE(dd.nivel,'—')", alias: 'nivel' }],
      ['data_ref', { expr: 'dd.data_ref::text', keyExpr: 'dd.data_ref::text', alias: 'data_ref' }],
      ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM')", keyExpr: "TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM')", alias: 'periodo' }],
      ['mes', { expr: "TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM')", keyExpr: "TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM')", alias: 'mes' }],
      ['conta', { expr: "COALESCE(cm.nome_conta, CONCAT('Conta #', dd.conta_id::text))", keyExpr: 'dd.conta_id', alias: 'conta' }],
      ['conta_id', { expr: "COALESCE(cm.nome_conta, CONCAT('Conta #', dd.conta_id::text))", keyExpr: 'dd.conta_id', alias: 'conta_id' }],
      ['campanha', { expr: "COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text))", keyExpr: 'dd.campanha_id', alias: 'campanha' }],
      ['campanha_id', { expr: "COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text))", keyExpr: 'dd.campanha_id', alias: 'campanha_id' }],
      ['grupo', { expr: "COALESCE(ga.nome, CONCAT('Grupo #', dd.grupo_id::text))", keyExpr: 'dd.grupo_id', alias: 'grupo' }],
      ['grupo_id', { expr: "COALESCE(ga.nome, CONCAT('Grupo #', dd.grupo_id::text))", keyExpr: 'dd.grupo_id', alias: 'grupo_id' }],
      ['anuncio', { expr: "COALESCE(a.nome, CONCAT('Anúncio #', dd.anuncio_id::text))", keyExpr: 'dd.anuncio_id', alias: 'anuncio' }],
      ['anuncio_id', { expr: "COALESCE(a.nome, CONCAT('Anúncio #', dd.anuncio_id::text))", keyExpr: 'dd.anuncio_id', alias: 'anuncio_id' }],
    ])

    const measureMap = new Map<string, { expr: string; alias: string }>([
      ['sum(gasto)', { expr: 'COALESCE(SUM(dd.gasto),0)::float', alias: 'gasto_total' }],
      ['sum(receita_atribuida)', { expr: 'COALESCE(SUM(dd.receita_atribuida),0)::float', alias: 'receita_total' }],
      ['sum(cliques)', { expr: 'COALESCE(SUM(dd.cliques),0)::float', alias: 'cliques_total' }],
      ['sum(impressoes)', { expr: 'COALESCE(SUM(dd.impressoes),0)::float', alias: 'impressoes_total' }],
      ['sum(conversoes)', { expr: 'COALESCE(SUM(dd.conversoes),0)::float', alias: 'conversoes_total' }],
      ['sum(leads)', { expr: 'COALESCE(SUM(dd.leads),0)::float', alias: 'leads_total' }],
      ['sum(alcance)', { expr: 'COALESCE(SUM(dd.alcance),0)::float', alias: 'alcance_total' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'count' }],
      [
        'casewhensum(gasto)=0then0elsesum(receita_atribuida)/sum(gasto)end',
        { expr: 'CASE WHEN COALESCE(SUM(dd.gasto),0)=0 THEN 0 ELSE COALESCE(SUM(dd.receita_atribuida),0)/NULLIF(SUM(dd.gasto),0) END::float', alias: 'roas' },
      ],
    ])

    let dim = undefined as { expr: string; keyExpr?: string; alias: string } | undefined
    if (dimensionExprOverride) {
      const qualified = qualifyDimensionExpr(dimensionExprOverride)
      dim = { expr: qualified, keyExpr: qualified, alias: dimension || 'dimension' }
    } else if (dimension) {
      dim = dimMap.get(dimension.toLowerCase())
      if (!dim) {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    const meas = measureMap.get(normalizeExprKey(measure))
    if (!meas) {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    const params: unknown[] = []
    const whereParts: string[] = []

    if (isFiniteNumber(filters.tenant_id)) {
      whereParts.push(`dd.tenant_id = $${params.length + 1}`)
      params.push(filters.tenant_id)
    }
    if (typeof filters.de === 'string' && filters.de.trim()) {
      whereParts.push(`dd.data_ref >= $${params.length + 1}::date`)
      params.push(filters.de.trim())
    }
    if (typeof filters.ate === 'string' && filters.ate.trim()) {
      whereParts.push(`dd.data_ref <= $${params.length + 1}::date`)
      params.push(filters.ate.trim())
    }

    addEqOrInFilter(params, whereParts, 'dd.plataforma', filters.plataforma)
    addEqOrInFilter(params, whereParts, 'dd.nivel', filters.nivel)
    addEqOrInFilter(params, whereParts, 'dd.conta_id', filters.conta_id)
    addEqOrInFilter(params, whereParts, 'dd.campanha_id', filters.campanha_id)
    addEqOrInFilter(params, whereParts, 'dd.grupo_id', filters.grupo_id)
    addEqOrInFilter(params, whereParts, 'dd.anuncio_id', filters.anuncio_id)

    if (isFiniteNumber(filters.gasto_min)) {
      whereParts.push(`dd.gasto >= $${params.length + 1}`)
      params.push(filters.gasto_min)
    }
    if (isFiniteNumber(filters.gasto_max)) {
      whereParts.push(`dd.gasto <= $${params.length + 1}`)
      params.push(filters.gasto_max)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    if (!dim) {
      const sql = `SELECT ${meas.expr} AS value ${fromSql} ${whereSql}`.replace(/\s+/g, ' ').trim()
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params })
    }

    const dir = orderBy?.dir && String(orderBy.dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const orderField = orderBy?.field === 'dimension' ? '2' : '3'
    const sql = `
      SELECT ${dim.keyExpr || dim.expr} AS key, ${dim.expr} AS label, ${meas.expr} AS value
      ${fromSql}
      ${whereSql}
      GROUP BY 1, 2
      ORDER BY ${orderField} ${dir}
      LIMIT $${params.length + 1}::int
    `.replace(/\s+/g, ' ').trim()
    const execParams = [...params, limit]
    const rows = await runQuery<Record<string, unknown>>(sql, execParams)
    return Response.json({ success: true, rows, sql_query: sql, sql_params: execParams })
  } catch (error) {
    console.error('📣 API /api/modulos/trafegopago/query error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

