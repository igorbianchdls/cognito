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

    if (field === 'produto_id') {
      if (q) ctx.params.push(`%${q}%`)
      ctx.sql = `SELECT p.id AS value, COALESCE(p.nome, p.id::text) AS label
                 FROM produtos.produto p
                 ${q ? `WHERE COALESCE(p.nome, p.id::text) ILIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'almoxarifado_id') {
      if (q) ctx.params.push(`%${q}%`)
      ctx.sql = `SELECT a.id AS value, COALESCE(a.nome, a.id::text) AS label
                 FROM estoque.almoxarifados a
                 ${q ? `WHERE COALESCE(a.nome, a.id::text) ILIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'tipo_movimento') {
      if (q) ctx.params.push(`%${q.toLowerCase()}%`)
      ctx.sql = `SELECT DISTINCT LOWER(COALESCE(m.tipo_movimento, '—')) AS value,
                        LOWER(COALESCE(m.tipo_movimento, '—')) AS label
                 FROM estoque.movimentacoes_estoque m
                 ${q ? `WHERE LOWER(COALESCE(m.tipo_movimento, '—')) LIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'natureza') {
      if (q) ctx.params.push(`%${q.toLowerCase()}%`)
      ctx.sql = `SELECT DISTINCT LOWER(COALESCE(tm.natureza, '—')) AS value,
                        LOWER(COALESCE(tm.natureza, '—')) AS label
                 FROM estoque.tipos_movimentacao tm
                 ${q ? `WHERE LOWER(COALESCE(tm.natureza, '—')) LIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'status') {
      if (q) ctx.params.push(`%${q.toLowerCase()}%`)
      ctx.sql = `SELECT DISTINCT
                        LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) AS value,
                        LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) AS label
                 FROM estoque.almoxarifados a
                 ${q ? `WHERE LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) LIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else {
      return Response.json({ success: false, message: `Campo não suportado: ${field}` }, { status: 400 })
    }

    const rows = await runQuery<Option>(ctx.sql, ctx.params)
    return Response.json({ success: true, options: rows })
  } catch (error) {
    console.error('📦 API /api/modulos/estoque/options error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

