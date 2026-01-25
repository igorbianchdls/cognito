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
    const ativoParam = typeof payload.ativo === 'boolean' ? payload.ativo : undefined
    const page = typeof payload.page === 'number' && payload.page > 0 ? payload.page : 1
    const pageSize = typeof payload.pageSize === 'number' && payload.pageSize > 0 ? Math.min(1000, payload.pageSize) : (typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(1000, payload.limit) : 100)
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    // Resolve tenant
    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const selectSql = `SELECT cr.id,
                             cr.codigo,
                             cr.nome,
                             cr.descricao,
                             cr.tipo,
                             cr.natureza,
                             cr.plano_conta_id,
                             cr.ativo,
                             cr.criado_em,
                             cr.atualizado_em`
    const baseSql = `FROM financeiro.categorias_receita cr`
    push('cr.tenant_id =', tenantId)

    // Default: only active categories unless explicitly overridden
    push('cr.ativo =', (ativoParam === undefined ? true : ativoParam))
    if (q) { conditions.push(`(cr.nome ILIKE '%' || $${i} || '%' OR cr.codigo ILIKE '%' || $${i} || '%' OR COALESCE(cr.descricao,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    if (de) push('cr.criado_em >=', de)
    if (ate) push('cr.criado_em <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY cr.nome ASC, cr.id ASC'
    const limitOffset = `LIMIT $${i}::int OFFSET $${i+1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const sql = `${selectSql} ${baseSql} ${whereClause} ${orderClause} ${limitOffset}`.trim()
    const rows = await runQuery<Record<string, unknown>>(sql, paramsWithPage)
    const countSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(countSql, params)
    const count = totalRows[0]?.total ?? rows.length

    return Response.json({ ok: true, result: { success: true, rows, count, message: `${rows.length} categorias de receita`, title: 'Categorias de Receita', sql_query: sql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
