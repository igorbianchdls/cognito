import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const visibility = (searchParams.get('visibility') || '').trim()
    const limit = Number(searchParams.get('limit') || '20')
    const offset = Number(searchParams.get('offset') || '0')

    const params: unknown[] = []
    const where: string[] = ['tenant_id = 1']
    if (visibility) {
      params.push(visibility)
      where.push(`visibility = $${params.length}`)
    }
    if (q) {
      params.push(`%${q}%`)
      const idx = params.length
      where.push(`(title ILIKE $${idx} OR COALESCE(description,'') ILIKE $${idx})`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    // items query
    const itemsSql = `
      SELECT id, title, description, visibility, version, created_at, updated_at
      FROM apps.dashboards
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const items = await runQuery<{ id: string; title: string; description: string | null; visibility: string; version: number; created_at: string; updated_at: string }>(
      itemsSql,
      [...params, Number.isFinite(limit) ? limit : 20, Number.isFinite(offset) ? offset : 0]
    )

    // count query
    const countSql = `SELECT COUNT(*)::int AS count FROM apps.dashboards ${whereSql}`
    const countRows = await runQuery<{ count: number }>(countSql, params)
    const count = countRows?.[0]?.count ?? items.length

    return Response.json({ success: true, items, count })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar dashboards'
    return Response.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, sourcecode, visibility, version } = body || {}

    if (!title || typeof title !== 'string') return Response.json({ success: false, error: 'title é obrigatório' }, { status: 400 })
    if (!sourcecode || typeof sourcecode !== 'string') return Response.json({ success: false, error: 'sourcecode é obrigatório' }, { status: 400 })
    const vis: 'private'|'org'|'public' = visibility || 'private'
    if (!['private','org','public'].includes(vis)) return Response.json({ success: false, error: 'visibility inválida' }, { status: 400 })
    const ver = Number.isFinite(Number(version)) && Number(version) > 0 ? Number(version) : 1

    const insertSql = `
      INSERT INTO apps.dashboards (tenant_id, title, description, sourcecode, visibility, version)
      VALUES (1, $1, $2, $3, $4, $5)
      RETURNING id, title, description, sourcecode, visibility, version, created_at, updated_at
    `
    const rows = await runQuery<{
      id: string; title: string; description: string | null; sourcecode: string; visibility: string; version: number; created_at: string; updated_at: string
    }>(insertSql, [title, description || null, sourcecode, vis, ver])
    const item = rows?.[0]
    return Response.json({ success: true, item }, { status: 201 })
  } catch (e) {
    return Response.json({ success: false, error: (e as Error).message || 'Erro ao criar' }, { status: 500 })
  }
}
