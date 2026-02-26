import { NextRequest } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Option = { value: number | string; label: string }

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function parseScalarOrArray(searchParams: URLSearchParams, key: string): Array<number | string> {
  const raw = searchParams.getAll(key).map((v) => String(v || '').trim()).filter(Boolean)
  const uniq = Array.from(new Set(raw))
  return uniq.map((v) => {
    const n = Number(v)
    return String(n) === v && Number.isFinite(n) ? n : v
  })
}

function addEqOrInFilter(params: unknown[], whereParts: string[], col: string, values: Array<number | string>) {
  const arr = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
  if (!arr.length) return
  if (arr.length === 1) {
    whereParts.push(`${col} = $${params.length + 1}`)
    params.push(arr[0])
    return
  }
  const ph: string[] = []
  for (const item of arr) {
    ph.push(`$${params.length + 1}`)
    params.push(item)
  }
  whereParts.push(`${col} IN (${ph.join(',')})`)
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req.headers)
    const { searchParams } = new URL(req.url)
    const field = (searchParams.get('field') || '').trim().toLowerCase()
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)))

    const contaIds = parseScalarOrArray(searchParams, 'conta_id')
    const campanhaIds = parseScalarOrArray(searchParams, 'campanha_id')
    const grupoIds = parseScalarOrArray(searchParams, 'grupo_id')
    const anuncioIds = parseScalarOrArray(searchParams, 'anuncio_id')

    const baseJoins = `
      FROM trafegopago.desempenho_diario dd
      LEFT JOIN trafegopago.contas_midia cm ON cm.id = dd.conta_id
      LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id
      LEFT JOIN trafegopago.grupos_anuncio ga ON ga.id = dd.grupo_id
      LEFT JOIN trafegopago.anuncios a ON a.id = dd.anuncio_id
    `.replace(/\s+/g, ' ').trim()

    let valueExpr = ''
    let labelExpr = ''
    let notNullExpr = ''

    if (field === 'conta_id') {
      valueExpr = 'dd.conta_id'
      labelExpr = "COALESCE(cm.nome_conta, CONCAT('Conta #', dd.conta_id::text))"
      notNullExpr = 'dd.conta_id IS NOT NULL'
    } else if (field === 'campanha_id') {
      valueExpr = 'dd.campanha_id'
      labelExpr = "COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text))"
      notNullExpr = 'dd.campanha_id IS NOT NULL'
    } else if (field === 'grupo_id') {
      valueExpr = 'dd.grupo_id'
      labelExpr = "COALESCE(ga.nome, CONCAT('Grupo #', dd.grupo_id::text))"
      notNullExpr = 'dd.grupo_id IS NOT NULL'
    } else if (field === 'anuncio_id') {
      valueExpr = 'dd.anuncio_id'
      labelExpr = "COALESCE(a.nome, CONCAT('Anúncio #', dd.anuncio_id::text))"
      notNullExpr = 'dd.anuncio_id IS NOT NULL'
    } else {
      return Response.json({ success: false, message: `Campo não suportado: ${field}` }, { status: 400 })
    }

    const params: unknown[] = []
    const whereParts: string[] = []

    if (isFiniteNumber(tenantId)) {
      whereParts.push(`dd.tenant_id = $${params.length + 1}`)
      params.push(tenantId)
    }

    // Cascading filters sent by /options/resolve via contextFilters
    addEqOrInFilter(params, whereParts, 'dd.conta_id', contaIds)
    addEqOrInFilter(params, whereParts, 'dd.campanha_id', campanhaIds)
    addEqOrInFilter(params, whereParts, 'dd.grupo_id', grupoIds)
    addEqOrInFilter(params, whereParts, 'dd.anuncio_id', anuncioIds)

    whereParts.push(notNullExpr)

    if (q) {
      whereParts.push(`${labelExpr} ILIKE $${params.length + 1}`)
      params.push(`%${q}%`)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
    const sql = `
      SELECT DISTINCT ${valueExpr} AS value, ${labelExpr} AS label
      ${baseJoins}
      ${whereSql}
      ORDER BY label ASC
      LIMIT $${params.length + 1}::int
    `.replace(/\s+/g, ' ').trim()
    params.push(limit)

    const rows = await runQuery<Option>(sql, params)
    return Response.json({ success: true, options: rows })
  } catch (error) {
    console.error('📣 API /api/modulos/trafegopago/options error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}

