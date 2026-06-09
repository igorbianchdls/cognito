import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'

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
    const { tenantId } = await resolveIntegrationTenant(req, {
      requestedTenantId: search.get('tenantId') || search.get('tenant_id'),
      access: 'read',
    })
    // Discover columns for shared.users
    const meta = await runQuery<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='shared' AND table_name='users'`
    )
    const cols = (meta || []).map(r => r.column_name)
    const label = pickLabelColumn(cols)
    const labelExpr = label.col ? `users.${label.col}::text` : 'users.id::text'
    const where = q ? `AND (${labelExpr} ILIKE $2 OR users.id::text ILIKE $2)` : ''
    const params = q ? [tenantId, `%${q}%`] : [tenantId]
    const sql = `
      SELECT users.id::text AS id, ${labelExpr} AS label
      FROM shared.users AS users
      JOIN shared.tenant_memberships AS memberships
        ON memberships.user_id = users.id
      WHERE memberships.tenant_id = $1
        AND memberships.status = 'active'
        ${where}
      ORDER BY ${labelExpr}
      LIMIT 100`
    const rows = await runQuery<{ id: string, label: string }>(sql, params)
    return Response.json({ ok: true, items: rows })
  } catch (e: any) {
    const authResponse = integrationAuthErrorResponse(e)
    if (authResponse) return authResponse

    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
