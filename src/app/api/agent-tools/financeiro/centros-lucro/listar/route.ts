import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

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

    const q = typeof payload.q === 'string' ? payload.q : undefined
    const de = typeof payload.de === 'string' ? payload.de : undefined
    const ate = typeof payload.ate === 'string' ? payload.ate : undefined
    const ativo = typeof payload.ativo === 'boolean' ? payload.ativo : undefined
    const page = typeof payload.page === 'number' && payload.page > 0 ? payload.page : 1
    const pageSize = typeof payload.pageSize === 'number' && payload.pageSize > 0 ? Math.min(1000, payload.pageSize) : (typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(1000, payload.limit) : 200)
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT cl.id, cl.tenant_id, cl.codigo, cl.nome, cl.descricao, cl.ativo, cl.criado_em, cl.atualizado_em`
    const baseSql = `FROM financeiro.centros_lucro cl`
    if (typeof ativo === 'boolean') push('cl.ativo =', ativo)
    if (q) { conditions.push(`(cl.nome ILIKE '%' || $${i} || '%' OR cl.codigo ILIKE '%' || $${i} || '%' OR COALESCE(cl.descricao,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    if (de) push('cl.criado_em >=', de)
    if (ate) push('cl.criado_em <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY cl.nome ASC, cl.id ASC'
    const limitOffset = `LIMIT $${i}::int OFFSET $${i+1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const sql = `${selectSql} ${baseSql} ${whereClause} ${orderClause} ${limitOffset}`.trim()
    const rows = await runQuery<Record<string, unknown>>(sql, paramsWithPage)
    const countSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totals = await runQuery<{ total: number }>(countSql, params)
    const count = totals[0]?.total ?? rows.length

    return Response.json({ ok: true, result: { success: true, rows, count, message: `${rows.length} centros de lucro`, title: 'Centros de Lucro', sql_query: sql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

