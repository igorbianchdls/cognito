import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contaId = searchParams.get('conta_id')
    const hasFilter = !!contaId
    const tenantId = resolveTenantId(req.headers)
    const params: unknown[] = [tenantId]
    let i = 2
    const conds: string[] = [`ct.tenant_id = $1`]
    if (hasFilter) { conds.push(`ct.conta_id = $${i++}`); params.push(Number(contaId)) }
    const where = `WHERE ${conds.join(' AND ')}`
    const rows = await runQuery<{ id: number; nome: string; conta_id: number | null }>(
      `SELECT ct.id, ct.nome, ct.conta_id FROM crm.contatos ct ${where} ORDER BY ct.nome ASC`,
      params
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/contatos/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
