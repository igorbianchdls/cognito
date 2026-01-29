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

    type Ctx = { sql: string; params: unknown[] }
    const ctx: Ctx = { sql: '', params: [] }
    const like = (alias: string) => {
      if (!q) return ''
      ctx.params.push(`%${q}%`)
      return ` WHERE ${alias} ILIKE $${ctx.params.length}`
    }

    if (field === 'vendedor_id') {
      const where = like(`COALESCE(f.nome,'—')`)
      ctx.sql = `SELECT v.id AS value, COALESCE(f.nome,'—') AS label
                 FROM comercial.vendedores v
                 LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'cliente_id') {
      const where = like(`COALESCE(c.nome_fantasia,'—')`)
      ctx.sql = `SELECT c.id AS value, COALESCE(c.nome_fantasia,'—') AS label
                 FROM entidades.clientes c
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'canal_venda_id') {
      const where = like(`COALESCE(cv.nome,'—')`)
      ctx.sql = `SELECT cv.id AS value, COALESCE(cv.nome,'—') AS label
                 FROM vendas.canais_venda cv
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'filial_id') {
      const where = like(`COALESCE(fil.nome,'—')`)
      ctx.sql = `SELECT fil.id AS value, COALESCE(fil.nome,'—') AS label
                 FROM empresa.filiais fil
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'unidade_negocio_id') {
      const where = like(`COALESCE(un.nome,'—')`)
      ctx.sql = `SELECT un.id AS value, COALESCE(un.nome,'—') AS label
                 FROM empresa.unidades_negocio un
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'territorio_id') {
      const where = like(`COALESCE(t.nome,'—')`)
      ctx.sql = `SELECT t.id AS value, COALESCE(t.nome,'—') AS label
                 FROM comercial.territorios t
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'categoria_receita_id') {
      const where = like(`COALESCE(cr.nome,'—')`)
      ctx.sql = `SELECT cr.id AS value, COALESCE(cr.nome,'—') AS label
                 FROM financeiro.categorias_receita cr
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'status') {
      const where = q ? ` WHERE LOWER(p.status) LIKE $1` : ''
      const params = q ? [`%${q.toLowerCase()}%`, limit] : [limit]
      ctx.sql = `SELECT DISTINCT LOWER(p.status) AS value, LOWER(p.status) AS label
                 FROM vendas.pedidos p
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
    console.error('🛍️ API /api/modulos/vendas/options error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

