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
      `SELECT v.id, f.nome
       FROM comercial.vendedores v
       JOIN entidades.funcionarios f ON f.id = v.funcionario_id AND f.tenant_id = v.tenant_id
       WHERE v.tenant_id = $1 AND COALESCE(v.ativo,true) = true
       ORDER BY f.nome ASC`,
      [tenantId]
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/vendedores/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
