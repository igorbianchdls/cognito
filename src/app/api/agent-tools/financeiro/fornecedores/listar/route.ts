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

    const q = typeof payload.q === 'string' ? payload.q : undefined
    const limit = typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(1000, payload.limit) : 200

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    let sql = `SELECT id, nome_fantasia AS nome, COALESCE(cnpj,'')::text AS cnpj FROM entidades.fornecedores`
    if (q) {
      conditions.push(`(nome_fantasia ILIKE '%' || $${i} || '%' OR COALESCE(cnpj,'') ILIKE '%' || $${i} || '%' OR COALESCE(email,'') ILIKE '%' || $${i} || '%')`)
      params.push(q); i += 1
    }
    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    sql = `${sql}${whereClause} ORDER BY nome_fantasia ASC LIMIT $${i}::int`
    const rows = await runQuery<{ id: number; nome: string; cnpj: string }>(sql, [...params, limit])

    let out = rows
    if (!rows?.length) {
      // Fallback: fornecedores observados em compras
      const fbSql = `SELECT DISTINCT c.fornecedor_id AS id,
                            COALESCE(f.nome_fantasia, 'Fornecedor #' || c.fornecedor_id::text) AS nome,
                            COALESCE(f.cnpj,'')::text AS cnpj
                       FROM compras.compras c
                       LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
                      WHERE c.fornecedor_id IS NOT NULL
                      ORDER BY 2 ASC
                      LIMIT $1::int`
      out = await runQuery<{ id: number; nome: string; cnpj: string }>(fbSql, [limit])
    }

    return Response.json({ ok: true, result: { success: true, rows: out, count: out.length, message: `${out.length} fornecedores`, title: 'Fornecedores', sql_query: sql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

