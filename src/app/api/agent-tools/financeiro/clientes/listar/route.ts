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
    const limit = typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(1000, payload.limit) : 200

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    // Resolve tenant
    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    let sql = `SELECT id, nome_fantasia AS nome FROM entidades.clientes`
    push('tenant_id =', tenantId)
    if (q) { push(`(nome_fantasia ILIKE '%' ||`, q); conditions[conditions.length - 1] += ` $${i-1} || '%')` }
    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    sql = `${sql}${whereClause} ORDER BY nome_fantasia ASC LIMIT $${i}::int`
    const rows = await runQuery<{ id: number; nome: string }>(sql, [...params, limit])

    let out = rows
    if (!rows?.length) {
      // Fallback conforme módulo: clientes presentes em lançamentos financeiros
      const fbSql = `SELECT DISTINCT lf.cliente_id AS id,
                            COALESCE(c.nome_fantasia, 'Cliente #' || lf.cliente_id::text) AS nome
                       FROM financeiro.lancamentos_financeiros lf
                       LEFT JOIN entidades.clientes c ON c.id = lf.cliente_id
                      WHERE lf.cliente_id IS NOT NULL AND lf.tenant_id = $2
                      ORDER BY 2 ASC
                      LIMIT $1::int`
      out = await runQuery<{ id: number; nome: string }>(fbSql, [limit, tenantId])
    }

    return Response.json({ ok: true, result: { success: true, rows: out, count: out.length, message: `${out.length} clientes`, title: 'Clientes', sql_query: sql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
