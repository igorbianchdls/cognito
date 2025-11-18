import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  const rows = await runQuery(`
    SELECT id, title, description, sourcecode, visibility, version, created_at, updated_at
    FROM apps.dashboards WHERE id = $1 LIMIT 1
  `, [id])
  const item = rows?.[0]
  if (!item) return Response.json({ success: false, error: 'Dashboard não encontrado' }, { status: 404 })
  return Response.json({ success: true, item })
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  const body = await req.json()
  const fields: Record<string, unknown> = {}
  ;(['title','description','sourcecode','visibility','version'] as const).forEach(k => {
    if (body[k] !== undefined) fields[k] = body[k]
  })
  if (Object.keys(fields).length === 0) return Response.json({ success: false, error: 'Nada para atualizar' }, { status: 400 })

  const setParts: string[] = []
  const params: unknown[] = []
  let idx = 1
  if (fields.title !== undefined) { setParts.push(`title = $${idx++}`); params.push(fields.title) }
  if (fields.description !== undefined) { setParts.push(`description = $${idx++}`); params.push(fields.description ?? null) }
  if (fields.sourcecode !== undefined) { setParts.push(`sourcecode = $${idx++}`); params.push(fields.sourcecode) }
  if (fields.visibility !== undefined) { setParts.push(`visibility = $${idx++}`); params.push(fields.visibility) }
  if (fields.version !== undefined) { setParts.push(`version = $${idx++}`); params.push(Number(fields.version)) }
  setParts.push(`updated_at = NOW()`) // always bump updated_at
  params.push(id)

  const sql = `
    UPDATE apps.dashboards SET ${setParts.join(', ')}
    WHERE id = $${idx}
    RETURNING id, title, description, sourcecode, visibility, version, created_at, updated_at
  `
  const rows = await runQuery(sql, params)
  const item = rows?.[0]
  if (!item) return Response.json({ success: false, error: 'Falha ao atualizar' }, { status: 500 })
  return Response.json({ success: true, item })
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  await runQuery('DELETE FROM apps.dashboards WHERE id = $1', [id])
  return Response.json({ success: true })
}
