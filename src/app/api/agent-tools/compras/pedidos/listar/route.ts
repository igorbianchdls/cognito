import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    // Inputs (alinhados à aba /erp/compras, view=compras)
    const de = typeof payload.de === 'string' ? payload.de : undefined
    const ate = typeof payload.ate === 'string' ? payload.ate : undefined
    const status = typeof payload.status === 'string' ? payload.status : undefined
    const fornecedor_id = typeof payload.fornecedor_id === 'string' || typeof payload.fornecedor_id === 'number'
      ? String(payload.fornecedor_id)
      : undefined
    const q = typeof payload.q === 'string' ? payload.q : undefined
    const page = typeof payload.page === 'number' && payload.page > 0 ? payload.page : 1
    const pageSize = typeof payload.pageSize === 'number' && payload.pageSize > 0 ? Math.min(1000, payload.pageSize) : (typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(1000, payload.limit) : 20)
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT
      c.id AS compra_id,
      f.nome_fantasia AS fornecedor,
      fil.nome AS filial,
      cc.nome AS centro_custo,
      p.nome AS projeto,
      cd.nome AS categoria_despesa,
      c.numero_oc AS numero_pedido,
      c.data_emissao AS data_pedido,
      c.data_entrega_prevista,
      c.status,
      c.valor_total,
      c.observacoes,
      c.criado_em,
      c.atualizado_em,
      NULL::text AS condicao_pagamento`
    const baseSql = `FROM compras.compras c
      LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
      LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
      LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
      LEFT JOIN financeiro.projetos p ON p.id = c.projeto_id
      LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id`

    if (status) push('LOWER(c.status) =', status.toLowerCase())
    if (fornecedor_id) push('c.fornecedor_id =', fornecedor_id)
    if (de) push('c.data_emissao >=', de)
    if (ate) push('c.data_emissao <=', ate)
    if (q) { conditions.push(`(c.numero_oc ILIKE '%' || $${i} || '%' OR COALESCE(c.observacoes,'') ILIKE '%' || $${i} || '%' OR COALESCE(f.nome_fantasia,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY c.data_emissao ASC, c.numero_oc ASC, c.id ASC'
    const limitOffset = `LIMIT $${i}::int OFFSET $${i+1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitOffset}`.trim()
    const rows = await runQuery<Record<string, unknown>>(sql, paramsWithPage)

    const countSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(countSql, params)
    const count = totalRows[0]?.total ?? rows.length

    const title = 'Pedidos de Compra'
    const message = `${rows.length} compras encontradas`
    return Response.json({ ok: true, result: { success: true, rows, count, message, title, sql_query: sql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
