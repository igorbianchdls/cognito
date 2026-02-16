import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req.headers)
    const rows = await runQuery<{ id: number; nome: string }>(
      `SELECT id, nome FROM vendas.canais_venda WHERE tenant_id = $1 ORDER BY nome ASC`,
      [tenantId]
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/canais/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
