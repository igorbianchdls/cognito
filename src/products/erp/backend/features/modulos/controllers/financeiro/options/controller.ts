import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Option = { value: number | string; label: string }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const field = (searchParams.get('field') || '').trim().toLowerCase()
    const q = searchParams.get('q') || undefined
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)))

    const ctx: { sql: string; params: unknown[] } = { sql: '', params: [] }
    const like = (expr: string) => {
      if (!q) return ''
      ctx.params.push(`%${q}%`)
      return ` WHERE ${expr} ILIKE $${ctx.params.length}`
    }

    if (field === 'cliente_id') {
      const where = like(`COALESCE(cli.nome_fantasia,'—')`)
      ctx.sql = `SELECT cli.id AS value, COALESCE(cli.nome_fantasia,'—') AS label
                 FROM entidades.clientes cli
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'centro_lucro_id') {
      const where = like(`COALESCE(cl.nome,'—')`)
      ctx.sql = `SELECT cl.id AS value, COALESCE(cl.nome,'—') AS label
                 FROM empresa.centros_lucro cl
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'status') {
      // AP e AR podem ter status diferentes; levantar de ambas
      const where = q ? ` WHERE s LIKE $1` : ''
      const params = q ? [`%${q.toLowerCase()}%`, limit] : [limit]
      ctx.sql = `WITH sts AS (
                   SELECT LOWER(cp.status) AS s FROM financeiro.contas_pagar cp
                   UNION
                   SELECT LOWER(cr.status) AS s FROM financeiro.contas_receber cr
                 )
                 SELECT DISTINCT s AS value, s AS label FROM sts
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${q ? 2 : 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(...params)
    } else {
      return Response.json({ success: false, message: `Campo não suportado: ${field}` }, { status: 400 })
    }

    const rows = await runQuery<Option>(ctx.sql, ctx.params)
    return Response.json({ success: true, options: rows })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/options error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

