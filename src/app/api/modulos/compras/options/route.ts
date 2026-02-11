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

    if (field === 'fornecedor_id') {
      const where = like(`COALESCE(f.nome_fantasia,'—')`)
      ctx.sql = `SELECT f.id AS value, COALESCE(f.nome_fantasia,'—') AS label
                 FROM entidades.fornecedores f
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
    } else if (field === 'centro_custo_id') {
      const where = like(`COALESCE(cc.nome,'—')`)
      ctx.sql = `SELECT cc.id AS value, COALESCE(cc.nome,'—') AS label
                 FROM empresa.centros_custo cc
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'departamento_id') {
      const where = like(`COALESCE(dep.nome,'—')`)
      ctx.sql = `SELECT dep.id AS value, COALESCE(dep.nome,'—') AS label
                 FROM empresa.departamentos dep
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
    } else if (field === 'categoria_despesa_id') {
      const where = like(`COALESCE(cd.nome,'—')`)
      ctx.sql = `SELECT cd.id AS value, COALESCE(cd.nome,'—') AS label
                 FROM financeiro.categorias_despesa cd
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'status') {
      const where = q ? ` WHERE LOWER(c.status) LIKE $1` : ''
      const params = q ? [`%${q.toLowerCase()}%`, limit] : [limit]
      ctx.sql = `SELECT DISTINCT LOWER(c.status) AS value, LOWER(c.status) AS label
                 FROM compras.compras c
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
    console.error('📦 API /api/modulos/compras/options error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
