import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

function pickLabelColumn(cols: string[]): { expr: string, col?: string } {
  const candidates = ['name', 'full_name', 'fullname', 'display_name', 'nome', 'email', 'username']
  const set = new Set(cols.map(c => c.toLowerCase()))
  for (const c of candidates) {
    if (set.has(c)) {
      return { expr: `${c}::text`, col: c }
    }
  }
  return { expr: `id::text`, col: undefined }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams
    const q = (search.get('q') || '').trim()
    // Discover columns for shared.users
    const meta = await runQuery<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='shared' AND table_name='users'`
    )
    const cols = (meta || []).map(r => r.column_name)
    const label = pickLabelColumn(cols)
    const labelExpr = label.expr
    const where = q ? `WHERE (${labelExpr} ILIKE $1 OR id::text ILIKE $1)` : ''
    const params = q ? [`%${q}%`] : []
    const sql = `SELECT id::text AS id, ${labelExpr} AS label FROM shared.users ${where} ORDER BY ${labelExpr} LIMIT 100`
    const rows = await runQuery<{ id: string, label: string }>(sql, params)
    return Response.json({ ok: true, items: rows })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

