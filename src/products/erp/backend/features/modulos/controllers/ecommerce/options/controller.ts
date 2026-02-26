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

    const plataformaValues = parseScalarOrArray(searchParams, 'plataforma')
    const contaValues = parseScalarOrArray(searchParams, 'canal_conta_id')
    const lojaValues = parseScalarOrArray(searchParams, 'loja_id')
    const statusValues = parseScalarOrArray(searchParams, 'status')
    const statusPagamentoValues = parseScalarOrArray(searchParams, 'status_pagamento')
    const statusFulfillmentValues = parseScalarOrArray(searchParams, 'status_fulfillment')

    const params: unknown[] = []
    const whereParts: string[] = []
    let fromSql = ''
    let valueExpr = ''
    let labelExpr = ''
    let notNullExpr = ''

    if (field === 'canal_conta_id' || field === 'loja_id' || field === 'status' || field === 'status_pagamento' || field === 'status_fulfillment' || field === 'plataforma') {
      fromSql = `
        FROM ecommerce.pedidos p
        LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
        LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
      `.replace(/\s+/g, ' ').trim()

      if (field === 'canal_conta_id') {
        valueExpr = 'p.canal_conta_id'
        labelExpr = "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))"
        notNullExpr = 'p.canal_conta_id IS NOT NULL'
      } else if (field === 'loja_id') {
        valueExpr = 'p.loja_id'
        labelExpr = "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))"
        notNullExpr = 'p.loja_id IS NOT NULL'
      } else if (field === 'status') {
        valueExpr = 'p.status'
        labelExpr = "COALESCE(p.status, '—')"
        notNullExpr = 'p.status IS NOT NULL'
      } else if (field === 'status_pagamento') {
        valueExpr = 'p.status_pagamento'
        labelExpr = "COALESCE(p.status_pagamento, '—')"
        notNullExpr = 'p.status_pagamento IS NOT NULL'
      } else if (field === 'status_fulfillment') {
        valueExpr = 'p.status_fulfillment'
        labelExpr = "COALESCE(p.status_fulfillment, '—')"
        notNullExpr = 'p.status_fulfillment IS NOT NULL'
      } else {
        valueExpr = 'p.plataforma'
        labelExpr = "COALESCE(p.plataforma, '—')"
        notNullExpr = 'p.plataforma IS NOT NULL'
      }

      if (isFiniteNumber(tenantId)) {
        whereParts.push(`p.tenant_id = $${params.length + 1}`)
        params.push(tenantId)
      }
      addEqOrInFilter(params, whereParts, 'p.plataforma', plataformaValues)
      addEqOrInFilter(params, whereParts, 'p.canal_conta_id', contaValues)
      addEqOrInFilter(params, whereParts, 'p.loja_id', lojaValues)
      addEqOrInFilter(params, whereParts, 'p.status', statusValues)
      addEqOrInFilter(params, whereParts, 'p.status_pagamento', statusPagamentoValues)
      addEqOrInFilter(params, whereParts, 'p.status_fulfillment', statusFulfillmentValues)
    } else if (field === 'produto_id' || field === 'categoria') {
      fromSql = `
        FROM ecommerce.pedido_itens pi
        LEFT JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
        LEFT JOIN ecommerce.produtos pr ON pr.id = pi.produto_id
      `.replace(/\s+/g, ' ').trim()

      if (field === 'produto_id') {
        valueExpr = 'pi.produto_id'
        labelExpr = "COALESCE(pr.nome, pi.titulo_item, CONCAT('Produto #', pi.produto_id::text))"
        notNullExpr = 'pi.produto_id IS NOT NULL'
      } else {
        valueExpr = "COALESCE(pr.categoria, 'Sem categoria')"
        labelExpr = "COALESCE(pr.categoria, 'Sem categoria')"
        notNullExpr = 'pr.categoria IS NOT NULL'
      }

      if (isFiniteNumber(tenantId)) {
        whereParts.push(`pi.tenant_id = $${params.length + 1}`)
        params.push(tenantId)
      }
      addEqOrInFilter(params, whereParts, 'p.plataforma', plataformaValues)
      addEqOrInFilter(params, whereParts, 'p.canal_conta_id', contaValues)
      addEqOrInFilter(params, whereParts, 'p.loja_id', lojaValues)
      addEqOrInFilter(params, whereParts, 'p.status', statusValues)
      addEqOrInFilter(params, whereParts, 'p.status_pagamento', statusPagamentoValues)
      addEqOrInFilter(params, whereParts, 'p.status_fulfillment', statusFulfillmentValues)
    } else {
      return Response.json({ success: false, message: `Campo não suportado: ${field}` }, { status: 400 })
    }

    whereParts.push(notNullExpr)

    if (q) {
      whereParts.push(`${labelExpr} ILIKE $${params.length + 1}`)
      params.push(`%${q}%`)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
    const sql = `
      SELECT DISTINCT ${valueExpr} AS value, ${labelExpr} AS label
      ${fromSql}
      ${whereSql}
      ORDER BY label ASC
      LIMIT $${params.length + 1}::int
    `.replace(/\s+/g, ' ').trim()
    params.push(limit)

    const rows = await runQuery<Option>(sql, params)
    return Response.json({ success: true, options: rows })
  } catch (error) {
    console.error('🛍️ API /api/modulos/ecommerce/options error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
